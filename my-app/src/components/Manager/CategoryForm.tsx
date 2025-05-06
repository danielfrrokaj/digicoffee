import React, { useState, useEffect } from 'react';
import { Category } from '../../hooks/useCategories';

interface CategoryFormProps {
  initialCategory: Partial<Category> | null;
  onSubmit: (categoryData: {
    name: string;
    description: string | null;
    display_order: number;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialCategory,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  
  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name || '');
      setDescription(initialCategory.description || '');
      setDisplayOrder(initialCategory.display_order?.toString() || '0');
    } else {
      setName('');
      setDescription('');
      setDisplayOrder('0');
    }
  }, [initialCategory]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderValue = parseInt(displayOrder);
    if (isNaN(orderValue)) {
      alert('Please enter a valid display order number');
      return;
    }
    
    onSubmit({
      name,
      description: description || null,
      display_order: orderValue
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
          Category Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="categoryDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
          Display Order <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="displayOrder"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          min="0"
          step="1"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Lower numbers will appear first. Use this to control the order categories are displayed.
        </p>
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
            : initialCategory
            ? 'Save Changes'
            : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm; 