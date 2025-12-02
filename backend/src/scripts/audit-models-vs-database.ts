import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false
});

interface ModelColumn {
  name: string;
  type: string;
  allowNull: boolean;
  defaultValue?: any;
}

interface ModelDefinition {
  tableName: string;
  columns: ModelColumn[];
}

// Parse model files to extract column definitions
function parseModelFile(filePath: string): ModelDefinition | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tableNameMatch = content.match(/tableName:\s*['"]([^'"]+)['"]/);
  if (!tableNameMatch) return null;

  const tableName = tableNameMatch[1];
  const columns: ModelColumn[] = [];

  // Extract @Column decorators
  const columnRegex = /@Column\s*\(\s*\{([^}]+)\}\s*\)\s*\n\s*(\w+)!/g;
  let match;

  while ((match = columnRegex.exec(content)) !== null) {
    const columnDef = match[1];
    const columnName = match[2];

    // Skip if it's a primary key or foreign key (handled separately)
    if (columnDef.includes('primaryKey: true') || columnDef.includes('@ForeignKey')) {
      continue;
    }

    // Extract type
    const typeMatch = columnDef.match(/type:\s*DataType\.(\w+)(?:\(([^)]+)\))?/);
    const type = typeMatch ? typeMatch[1] : 'STRING';

    // Extract allowNull
    const allowNullMatch = columnDef.match(/allowNull:\s*(true|false)/);
    const allowNull = allowNullMatch ? allowNullMatch[1] === 'true' : true;

    // Extract defaultValue
    const defaultValueMatch = columnDef.match(/defaultValue:\s*([^,}]+)/);
    const defaultValue = defaultValueMatch ? defaultValueMatch[1].trim() : undefined;

    columns.push({
      name: columnName,
      type,
      allowNull,
      defaultValue
    });
  }

  // Also extract foreign keys
  const foreignKeyRegex = /@ForeignKey[^@]*@Column\s*\(\s*\{([^}]+)\}\s*\)\s*\n\s*(\w+)!/g;
  while ((match = foreignKeyRegex.exec(content)) !== null) {
    const columnDef = match[1];
    const columnName = match[2];

    const typeMatch = columnDef.match(/type:\s*DataType\.(\w+)(?:\(([^)]+)\))?/);
    const type = typeMatch ? typeMatch[1] : 'INTEGER';

    const allowNullMatch = columnDef.match(/allowNull:\s*(true|false)/);
    const allowNull = allowNullMatch ? allowNullMatch[1] === 'true' : true;

    columns.push({
      name: columnName,
      type,
      allowNull,
      defaultValue: undefined
    });
  }

  return { tableName, columns };
}

async function getDatabaseColumns(tableName: string): Promise<string[]> {
  const results = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = :tableName
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `, {
    replacements: { tableName },
    type: QueryTypes.SELECT
  }) as any[];

  return results.map((r: any) => r.column_name);
}

async function main() {
  const modelsDir = path.join(__dirname, '../db/models');
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'BaseModel.ts')
    .map(f => path.join(modelsDir, f));

  const discrepancies: Array<{
    tableName: string;
    modelFile: string;
    missingColumns: ModelColumn[];
  }> = [];

  for (const modelFile of modelFiles) {
    const modelDef = parseModelFile(modelFile);
    if (!modelDef) {
      console.log(`⚠️  Could not parse ${path.basename(modelFile)}`);
      continue;
    }

    const dbColumns = await getDatabaseColumns(modelDef.tableName);
    const modelColumnNames = modelDef.columns.map(c => c.name);

    const missingColumns = modelDef.columns.filter(
      col => !dbColumns.includes(col.name)
    );

    if (missingColumns.length > 0) {
      discrepancies.push({
        tableName: modelDef.tableName,
        modelFile: path.basename(modelFile),
        missingColumns
      });
    }
  }

  if (discrepancies.length === 0) {
    console.log('✅ All model columns exist in database!');
  } else {
    console.log(`\n❌ Found ${discrepancies.length} table(s) with missing columns:\n`);
    for (const disc of discrepancies) {
      console.log(`📋 Table: ${disc.tableName} (${disc.modelFile})`);
      console.log(`   Missing columns:`);
      for (const col of disc.missingColumns) {
        console.log(`     - ${col.name} (${col.type}, nullable: ${col.allowNull})`);
      }
      console.log('');
    }
  }

  await sequelize.close();
}

main().catch(console.error);

