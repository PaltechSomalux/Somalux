import React from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';
import "./NewProductFormModal.css";
export const NewProductFormModal = ({
  setShowNewProductForm,
  newProduct,
  setNewProduct,
  categories,
  fileInputRef,
  handleUploadImage,
  imageUploading,
  handleRemoveImage,
  handleAddProduct
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowNewProductForm(false)}>
      <div className="product-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="close-modal" onClick={() => setShowNewProductForm(false)}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleAddProduct({
            title: newProduct.title,
            price: parseFloat(newProduct.price),
            description: newProduct.description,
            category: newProduct.category,
            stock: parseInt(newProduct.stock),
            images: newProduct.images
          });
        }}>
          <div className="form-group">
            <label>Product Name</label>
            <input 
              type="text" 
              value={newProduct.title}
              onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input 
                type="number" 
                min="0.01" 
                step="0.01" 
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Stock Quantity</label>
              <input 
                type="number" 
                min="0" 
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>Product Images</label>
            <div className="image-upload">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleUploadImage}
                multiple
                style={{display: 'none'}}
              />
              <button 
                type="button" 
                className="upload-button"
                onClick={() => fileInputRef.current.click()}
                disabled={imageUploading}
              >
                {imageUploading ? 'Uploading...' : 'Upload Images'}
              </button>
              <span className="file-info">
                {newProduct.images.length > 0 ? `${newProduct.images.length} images selected` : 'No images selected'}
              </span>
            </div>
            
            {newProduct.images.length > 0 && (
              <div className="image-previews">
                {newProduct.images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image} alt={`Preview ${index + 1}`} />
                    <button 
                      className="remove-image"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setShowNewProductForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={!newProduct.title || !newProduct.price || !newProduct.description || !newProduct.category || !newProduct.stock || newProduct.images.length === 0}
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
