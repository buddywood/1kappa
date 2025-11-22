'use client';

import { useEffect, useState } from 'react';
import { fetchCategoryAttributeDefinitions } from '@/lib/api';
import type { Product, CategoryAttributeDefinition, ProductAttributeValue } from '@/lib/api';

interface ProductAttributesProps {
  product: Product;
}

export default function ProductAttributes({ product }: ProductAttributesProps) {
  const [attributeDefinitions, setAttributeDefinitions] = useState<CategoryAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (product.category_id) {
      fetchCategoryAttributeDefinitions(product.category_id)
        .then(setAttributeDefinitions)
        .catch((err) => {
          console.error('Error fetching attribute definitions:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [product.category_id]);

  if (!product.category_id || loading) {
    return null;
  }

  if (attributeDefinitions.length === 0) {
    return null;
  }

  // Use attribute_name from attribute values if available, otherwise match with definitions
  const attributesWithValues = (product.attributes || [])
    .map((attr) => {
      // Try to get attribute name from the attribute itself first (included by backend)
      let attributeName = attr.attribute_name;
      let attributeType = attr.attribute_type;
      let displayOrder = attr.display_order || 0;
      
      // Fallback: look up in definitions if attribute_name not present
      if (!attributeName && attributeDefinitions.length > 0) {
        const definition = attributeDefinitions.find(
          (def) => def.id === attr.attribute_definition_id
        );
        if (definition) {
          attributeName = definition.attribute_name;
          attributeType = definition.attribute_type;
          displayOrder = definition.display_order || 0;
        }
      }
      
      if (!attributeName) return null;

      // Get display value based on attribute type
      let displayValue = '';
      if (attributeType === 'BOOLEAN') {
        displayValue = attr.value_boolean ? 'Yes' : 'No';
      } else if (attributeType === 'NUMBER') {
        displayValue = attr.value_number?.toString() || '';
      } else {
        displayValue = attr.value_text || '';
      }

      if (!displayValue) return null;

      return { attributeName, displayValue, displayOrder };
    })
    .filter(
      (item): item is { attributeName: string; displayValue: string; displayOrder: number } => item !== null
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (attributesWithValues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-midnight-navy dark:text-gray-100 mb-4">Product Details</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {attributesWithValues.map(({ attributeName, displayValue }, index) => (
          <div key={index} className="border-b border-frost-gray/30 dark:border-gray-800/30 pb-3">
            <dt className="text-sm font-medium text-midnight-navy/70 dark:text-gray-400 mb-1">
              {attributeName}
            </dt>
            <dd className="text-base text-midnight-navy dark:text-gray-200 font-medium">
              {displayValue}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

