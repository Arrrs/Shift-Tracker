"use client";

import { Suspense, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, Tags, Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFinancialCategories } from "./actions";
import type { FinancialCategory } from "./actions";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { DeleteCategoryButton } from "./delete-category-button";
import { ArchiveCategoryButton } from "./archive-category-button";
import { UnarchiveCategoryButton } from "./unarchive-category-button";
import { getCurrencySymbol } from "@/lib/utils/time-format";

function CategoriesList() {
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"income" | "expense">("income");
  const [activeTypeTab, setActiveTypeTab] = useState<"income" | "expense" | "all">("all");

  const loadCategories = async () => {
    setLoading(true);
    const result = await getFinancialCategories();
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.categories) {
      setCategories(result.categories);
    }
  };

  const handleCategoryUpdate = () => {
    loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCategories = filteredCategories.filter(c => c.is_active);
  const archivedCategories = filteredCategories.filter(c => !c.is_active);

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading categories: {error}</div>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block border rounded-lg p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
        {/* Mobile skeleton */}
        <div className="block md:hidden space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2 pt-2 border-t">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCategoriesTable = (categoriesList: FinancialCategory[], showArchived: boolean) => {
    if (!categoriesList || categoriesList.length === 0) {
      return (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <Tags className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {showArchived ? "No archived categories" : "No categories found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {showArchived
                ? "Categories that you archive will appear here."
                : "Create custom income and expense categories to organize your financial records."
              }
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Desktop table view */}
        <div className="hidden md:block border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Default Amount</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoriesList.map((category) => {
                const isMandatory = category.name === "Other Income" || category.name === "Other Expense";
                return (
                  <tr key={category.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {category.icon && <span className="text-xl">{category.icon}</span>}
                        <span>{category.name}</span>
                        {isMandatory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {category.type === "income" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="capitalize">{category.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {category.default_amount && category.default_currency ? (
                        <span>
                          {getCurrencySymbol(category.default_currency)}
                          {Number(category.default_amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(category);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        {!isMandatory && (
                          <>
                            {category.is_active ? (
                              <ArchiveCategoryButton
                                categoryId={category.id}
                                variant="link"
                                size="sm"
                                onSuccess={handleCategoryUpdate}
                              />
                            ) : (
                              <UnarchiveCategoryButton
                                categoryId={category.id}
                                variant="link"
                                size="sm"
                                onSuccess={handleCategoryUpdate}
                              />
                            )}
                            <DeleteCategoryButton
                              categoryId={category.id}
                              categoryName={category.name}
                              onSuccess={handleCategoryUpdate}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="block md:hidden space-y-4">
          {categoriesList.map((category) => {
            const isMandatory = category.name === "Other Income" || category.name === "Other Expense";
            return (
              <div key={category.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {category.icon && <span className="text-xl">{category.icon}</span>}
                      <h3 className="font-semibold">{category.name}</h3>
                      {isMandatory && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {category.type === "income" ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className="capitalize">{category.type}</span>
                    </div>
                    {category.default_amount && category.default_currency && (
                      <p className="text-sm text-muted-foreground">
                        Default: {getCurrencySymbol(category.default_currency)}
                        {Number(category.default_amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Archived"}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {!isMandatory && (
                    <>
                      {category.is_active ? (
                        <ArchiveCategoryButton
                          categoryId={category.id}
                          variant="ghost"
                          size="sm"
                          onSuccess={handleCategoryUpdate}
                        />
                      ) : (
                        <UnarchiveCategoryButton
                          categoryId={category.id}
                          variant="ghost"
                          size="sm"
                          onSuccess={handleCategoryUpdate}
                        />
                      )}
                      <DeleteCategoryButton
                        categoryId={category.id}
                        categoryName={category.name}
                        onSuccess={handleCategoryUpdate}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderTabContent = (categoriesList: FinancialCategory[], showArchived: boolean) => {
    const incomeCategories = categoriesList.filter(c => c.type === "income");
    const expenseCategories = categoriesList.filter(c => c.type === "expense");

    return (
      <Tabs value={activeTypeTab} onValueChange={(value) => setActiveTypeTab(value as "income" | "expense" | "all")} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({categoriesList.length})
            </TabsTrigger>
            <TabsTrigger value="income">
              <TrendingUp className="h-3 w-3 mr-1" />
              Income ({incomeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="expense">
              <TrendingDown className="h-3 w-3 mr-1" />
              Expense ({expenseCategories.length})
            </TabsTrigger>
          </TabsList>

          {/* Add button - shows based on active type tab */}
          <div>
            {activeTypeTab === "income" && (
              <Button
                size="sm"
                onClick={() => {
                  setAddDialogType("income");
                  setAddDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {activeTypeTab === "expense" && (
              <Button
                size="sm"
                onClick={() => {
                  setAddDialogType("expense");
                  setAddDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {activeTypeTab === "all" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddDialogType("income");
                    setAddDialogOpen(true);
                  }}
                  className="hidden sm:flex"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Income
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddDialogType("expense");
                    setAddDialogOpen(true);
                  }}
                  className="hidden sm:flex"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Expense
                </Button>
                {/* Mobile: Dropdown menu with just icon */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="sm:hidden">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setAddDialogType("income");
                        setAddDialogOpen(true);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                      Add Income
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setAddDialogType("expense");
                        setAddDialogOpen(true);
                      }}
                    >
                      <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                      Add Expense
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {renderCategoriesTable(categoriesList, showArchived)}
        </TabsContent>

        <TabsContent value="income" className="mt-0">
          {renderCategoriesTable(incomeCategories, showArchived)}
        </TabsContent>

        <TabsContent value="expense" className="mt-0">
          {renderCategoriesTable(expenseCategories, showArchived)}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeCategories.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedCategories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {renderTabContent(activeCategories, false)}
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {renderTabContent(archivedCategories, true)}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedCategory && (
        <EditCategoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          category={selectedCategory}
          onSuccess={handleCategoryUpdate}
        />
      )}

      {/* Add Dialog */}
      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={addDialogType}
        onSuccess={handleCategoryUpdate}
      />
    </div>
  );
}

export default function CategoriesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize income and expenses with custom categories
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading categories...</div>}>
        <CategoriesList key={refreshTrigger} />
      </Suspense>
    </div>
  );
}
