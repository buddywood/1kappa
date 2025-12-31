"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  PlusCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  getSellerProducts,
  deleteProduct,
  getSellerProfile,
  type Product,
  type Seller,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function SellerListingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, sellerData] = await Promise.all([
          getSellerProducts(),
          getSellerProfile(),
        ]);
        setProducts(productsData);
        setSeller(sellerData);
      } catch (err: any) {
        console.error("Error loading listings:", err);
        setError(err.message || "Failed to load listings");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;

    setDeleting(true);
    try {
      await deleteProduct(deleteProductId);
      setProducts(products.filter((p) => p.id !== deleteProductId));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteProductId(null);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getProductStatus = (product: Product) => {
    if (!seller?.stripe_account_id) {
      return { text: "Blocked: Stripe", variant: "destructive" as const };
    }
    if (product.status === "INACTIVE") {
      return { text: "Inactive", variant: "secondary" as const };
    }
    return { text: "Live", variant: "default" as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black">
        <div className="p-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-6 w-80" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Card with Search and Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <Skeleton className="h-10 w-full md:w-96" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-20 hidden md:block" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Table Skeleton */}
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 pb-2 border-b">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
                {/* Table Rows */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 gap-4 items-center py-3 border-b last:border-0"
                  >
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            My Listings
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Manage and monitor all your product offerings.
          </p>
        </div>
        <Button asChild>
          <Link
            href="/seller-dashboard/listings/create"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Listing
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Badge variant="outline" className="text-muted-foreground">
                {filteredProducts.length} Products
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">
                Try adjusting your search or add a new listing.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getProductStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 border">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-midnight-navy dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {product.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-crimson">
                        {formatPrice(product.price_cents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="icon"
                            title="View Public Store"
                          >
                            <Link href={`/product/${product.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="icon"
                            title="Edit Listing"
                          >
                            <Link
                              href={`/seller-dashboard/listings/edit/${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Listing"
                            onClick={() => setDeleteProductId(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteProductId}
        onOpenChange={(open) => {
          if (!open) setDeleteProductId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will remove your product from the store. This action cannot
              be easily undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProductId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="bg-crimson hover:bg-crimson/90 text-white"
            >
              {deleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
