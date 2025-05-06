import React, { useState, useEffect } from 'react';
import { Product } from '../../hooks/useProducts';
import { Category } from '../../hooks/useCategories';
import ImageUpload from './ImageUpload';

interface ProductFormProps {
  initialProduct: Partial<Product> | null;
  categories: Category[];
  venueName: string;
  onSubmit: (productData: {
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    image_url: string | null;
    storage_path: string | null;
    is_available: boolean;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialProduct,
  categories,
  venueName,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price?.toString() || '');
      setCategoryId(initialProduct.category_id || '');
      setImageUrl(initialProduct.image_url || null);
      setStoragePath(initialProduct.storage_path || null);
      setIsAvailable(initialProduct.is_available ?? true);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId('');
      setImageUrl(null);
      setStoragePath(null);
      setIsAvailable(true);
    }
  }, [initialProduct]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      alert('Please enter a valid price');
      return;
    }
    
    onSubmit({
      name,
      description: description || null,
      price: priceValue,
      category_id: categoryId || null,
      image_url: imageUrl,
      storage_path: storagePath,
      is_available: isAvailable
    });
  };
  
  const handleImageUploaded = (newStoragePath: string, newPublicUrl: string) => {
    setStoragePath(newStoragePath);
    setImageUrl(newPublicUrl);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="productName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="productCategory"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">-- No Category --</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="productDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">
          Price (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="productPrice"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <ImageUpload
        currentImageUrl={imageUrl}
        currentStoragePath={storagePath}
        venueName={venueName}
        productName={name || 'product'}
        onImageUploaded={handleImageUploaded}
      />
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isAvailable"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
          Available on menu
        </label>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isSubmitting
            ? 'Saving...'
            : initialProduct
            ? 'Save Changes'
            : 'Add Item'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm; 