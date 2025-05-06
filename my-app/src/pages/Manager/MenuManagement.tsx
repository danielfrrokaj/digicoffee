import React, { useState, Fragment, useMemo } from 'react';
import { Dialog, Transition, Disclosure } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useVenueById } from '../../hooks/useVenueById';
import { 
  useFetchProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  Product
} from '../../hooks/useProducts';
import {
  useFetchCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  Category
} from '../../hooks/useCategories';
import ProductForm from '../../components/Manager/ProductForm';
import CategoryForm from '../../components/Manager/CategoryForm';

const MenuManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const venueId = userProfile?.venue_id || undefined;
  const { data: venue } = useVenueById(venueId);
  
  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Use our hooks for data fetching and mutations
  const { 
    data: products = [], 
    isLoading: isLoadingProducts
  } = useFetchProducts(venueId);
  
  const {
    data: categories = [],
    isLoading: isLoadingCategories
  } = useFetchCategories(venueId);
  
  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (product.category && product.category.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (product.description && product.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [products, searchTerm]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = new Map<string | null, Product[]>();
    
    // Group with no category
    grouped.set(null, []);
    
    // Create entry for each category
    categories.forEach(category => {
      grouped.set(category.id, []);
    });
    
    // Add products to their categories
    (searchTerm ? filteredProducts : products).forEach(product => {
      const categoryId = product.category_id;
      
      if (grouped.has(categoryId)) {
        grouped.get(categoryId)?.push(product);
      } else {
        // If category doesn't exist (might have been deleted), put in uncategorized
        grouped.get(null)?.push(product);
      }
    });
    
    return grouped;
  }, [products, filteredProducts, categories, searchTerm]);

  // PRODUCT HANDLERS
  const handleSubmitProduct = (productData: {
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    image_url: string | null;
    storage_path: string | null;
    is_available: boolean;
  }) => {
    if (selectedProduct) {
      // Update existing product
      updateProduct.mutate({
        id: selectedProduct.id,
        data: productData
      }, {
        onSuccess: () => {
          closeProductModal();
        }
      });
    } else {
      // Create new product
      if (!venueId) {
        alert('No venue selected');
        return;
      }
      
      const newProduct = {
        ...productData,
        venue_id: venueId,
        // Legacy field - keep for backward compatibility
        category: productData.category_id 
          ? categories.find(c => c.id === productData.category_id)?.name || null 
          : null
      };
      
      createProduct.mutate(newProduct, {
        onSuccess: () => {
          closeProductModal();
        }
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteProduct.mutate(id);
    }
  };

  const openCreateProductModal = (categoryId: string | null = null) => {
    setSelectedProduct(null);
    // Pre-select the category if opened from a category section
    const initialProduct = { category_id: categoryId } as Partial<Product>;
    setSelectedProduct(initialProduct as Product);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  // CATEGORY HANDLERS
  const handleSubmitCategory = (categoryData: {
    name: string;
    description: string | null;
    display_order: number;
  }) => {
    if (selectedCategory) {
      // Update existing category
      updateCategory.mutate({
        id: selectedCategory.id,
        data: categoryData
      }, {
        onSuccess: () => {
          closeCategoryModal();
        }
      });
    } else {
      // Create new category
      if (!venueId) {
        alert('No venue selected');
        return;
      }
      
      const newCategory = {
        ...categoryData,
        venue_id: venueId
      };
      
      createCategory.mutate(newCategory, {
        onSuccess: () => {
          closeCategoryModal();
        }
      });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) {
      deleteCategory.mutate(id);
    }
  };

  const openCreateCategoryModal = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        
        {venueId ? (
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={openCreateCategoryModal}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex-1 sm:flex-none justify-center"
              disabled={createCategory.isPending}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {createCategory.isPending ? 'Adding...' : 'Add Category'}
            </button>
            
            <button
              onClick={() => openCreateProductModal()}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex-1 sm:flex-none justify-center"
              disabled={createProduct.isPending}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {createProduct.isPending ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        ) : (
          <button disabled className="w-full sm:w-auto px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed">
            <PlusIcon className="h-4 w-4 inline mr-1" /> Add Item
          </button>
        )}
      </div>

      {!venueId && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">No Venue Assigned</h2>
          <p>You need to be assigned to a venue to manage its menu. Please contact an administrator.</p>
        </div>
      )}

      {venueId && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-6">
            {isLoadingCategories || isLoadingProducts ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Loading menu items...</p>
              </div>
            ) : (
              <>
                {/* Uncategorized products */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <Disclosure defaultOpen={!activeCategoryId}>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                          <div className="flex items-center">
                            {open ? (
                              <ChevronUpIcon className="h-5 w-5 text-gray-500 mr-2" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                            )}
                            <h3 className="text-lg font-medium">Uncategorized Items</h3>
                            <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                              {productsByCategory.get(null)?.length || 0}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateProductModal(null);
                            }}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                          >
                            <PlusIcon className="h-3 w-3 inline" /> Add
                          </button>
                        </Disclosure.Button>
                        
                        <Disclosure.Panel>
                          <div className="p-4">
                            {(productsByCategory.get(null)?.length || 0) > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {productsByCategory.get(null)?.map((product) => (
                                  <div 
                                    key={product.id} 
                                    className={`bg-white rounded-lg border overflow-hidden ${!product.is_available ? 'opacity-60' : ''}`}
                                  >
                                    <div className="h-40 bg-gray-200 flex items-center justify-center">
                                      {product.image_url ? (
                                        <img 
                                          src={product.image_url} 
                                          alt={product.name} 
                                          className="h-full w-full object-cover" 
                                        />
                                      ) : (
                                        <span className="text-gray-400">No image</span>
                                      )}
                                    </div>
                                    <div className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold">{product.name}</h3>
                                        <span className="font-semibold text-indigo-600">€{product.price.toFixed(2)}</span>
                                      </div>
                                      {!product.is_available && (
                                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mb-2">
                                          Unavailable
                                        </span>
                                      )}
                                      <p className="text-sm mb-3">{product.description || 'No description'}</p>
                                      <div className="flex justify-between gap-2">
                                        <button
                                          onClick={() => openEditProductModal(product)}
                                          className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded hover:bg-indigo-200 flex-1 flex items-center justify-center"
                                        >
                                          <PencilIcon className="h-3 w-3 mr-1" /> Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProduct(product.id)}
                                          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 flex-1 flex items-center justify-center"
                                        >
                                          <TrashIcon className="h-3 w-3 mr-1" /> Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-gray-500 py-4">
                                No uncategorized items found.
                              </p>
                            )}
                          </div>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </div>
                
                {/* Categories and their products */}
                {categories.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <Disclosure defaultOpen={category.id === activeCategoryId}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                            <div className="flex items-center">
                              {open ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-500 mr-2" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                              )}
                              <h3 className="text-lg font-medium">{category.name}</h3>
                              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                                {productsByCategory.get(category.id)?.length || 0}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditCategoryModal(category);
                                }}
                                className="p-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                title="Edit Category"
                              >
                                <PencilIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category.id);
                                }}
                                className="p-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                title="Delete Category"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCreateProductModal(category.id);
                                }}
                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                              >
                                <PlusIcon className="h-3 w-3 inline" /> Add Product
                              </button>
                            </div>
                          </Disclosure.Button>
                          
                          <Disclosure.Panel>
                            <div className="p-4">
                              {category.description && (
                                <p className="text-sm text-gray-600 mb-4 italic">{category.description}</p>
                              )}
                              {(productsByCategory.get(category.id)?.length || 0) > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {productsByCategory.get(category.id)?.map((product) => (
                                    <div 
                                      key={product.id} 
                                      className={`bg-white rounded-lg border overflow-hidden ${!product.is_available ? 'opacity-60' : ''}`}
                                    >
                                      <div className="h-40 bg-gray-200 flex items-center justify-center">
                                        {product.image_url ? (
                                          <img 
                                            src={product.image_url} 
                                            alt={product.name} 
                                            className="h-full w-full object-cover" 
                                          />
                                        ) : (
                                          <span className="text-gray-400">No image</span>
                                        )}
                                      </div>
                                      <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                          <h3 className="text-lg font-semibold">{product.name}</h3>
                                          <span className="font-semibold text-indigo-600">€{product.price.toFixed(2)}</span>
                                        </div>
                                        {!product.is_available && (
                                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mb-2">
                                            Unavailable
                                          </span>
                                        )}
                                        <p className="text-sm mb-3">{product.description || 'No description'}</p>
                                        <div className="flex justify-between gap-2">
                                          <button
                                            onClick={() => openEditProductModal(product)}
                                            className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded hover:bg-indigo-200 flex-1 flex items-center justify-center"
                                          >
                                            <PencilIcon className="h-3 w-3 mr-1" /> Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 flex-1 flex items-center justify-center"
                                          >
                                            <TrashIcon className="h-3 w-3 mr-1" /> Delete
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 py-4">
                                  No products in this category yet.
                                </p>
                              )}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                ))}
                
                {categories.length === 0 && (productsByCategory.get(null)?.length || 0) === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="mb-4">Your menu is empty. Start by adding a category or product.</p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={openCreateCategoryModal}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" /> Add Category
                      </button>
                      <button
                        onClick={() => openCreateProductModal()}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" /> Add Product
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Product Modal */}
      <Transition appear show={isProductModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeProductModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {selectedProduct?.id ? 'Edit Menu Item' : 'Add Menu Item'}
                  </Dialog.Title>
                  
                  <ProductForm
                    initialProduct={selectedProduct}
                    categories={categories}
                    venueName={venue?.name || 'venue'}
                    onSubmit={handleSubmitProduct}
                    onCancel={closeProductModal}
                    isSubmitting={createProduct.isPending || updateProduct.isPending}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Category Modal */}
      <Transition appear show={isCategoryModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeCategoryModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {selectedCategory ? 'Edit Category' : 'Create Category'}
                  </Dialog.Title>
                  
                  <CategoryForm
                    initialCategory={selectedCategory}
                    onSubmit={handleSubmitCategory}
                    onCancel={closeCategoryModal}
                    isSubmitting={createCategory.isPending || updateCategory.isPending}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MenuManagement;