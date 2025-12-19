'use strict';

class CategoryController {
    async getAllCategories(req, res, next) {
        try {
            const { Category } = req.app.get('models');
            
            const categories = await Category.findAll({
                attributes: ['id', 'CategoryName'],
                order: [['CategoryName', 'ASC']]
            });

            res.json({
                success: true,
                categories: categories,
                count: categories.length
            });
            
        } catch (error) {
            console.error('Category controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories',
                details: error.message
            });
        }
    }

    async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const { Category } = req.app.get('models');
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid category ID provided'
                });
            }
            
            const category = await Category.findByPk(id, {
                attributes: ['id', 'CategoryName']
            });
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: 'Category not found'
                });
            }
            
            res.json({
                success: true,
                category: category
            });
            
        } catch (error) {
            console.error('Category controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch category',
                details: error.message
            });
        }
    }

    async createCategory(req, res, next) {
        try {
            const { CategoryName } = req.body;
            const { Category } = req.app.get('models');
            
            if (!CategoryName || typeof CategoryName !== 'string' || CategoryName.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Category name is required and must be a non-empty string'
                });
            }
            
            const existingCategory = await Category.findOne({
                where: { CategoryName: CategoryName.trim() }
            });
            
            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    error: 'Category with this name already exists'
                });
            }
            
            const newCategory = await Category.create({
                CategoryName: CategoryName.trim()
            });
            
            res.status(201).json({
                success: true,
                category: newCategory,
                message: 'Category created successfully'
            });
            
        } catch (error) {
            console.error('Category controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create category',
                details: error.message
            });
        }
    }

    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { CategoryName } = req.body;
            const { Category } = req.app.get('models');
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid category ID provided'
                });
            }
            
            if (!CategoryName || typeof CategoryName !== 'string' || CategoryName.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Category name is required and must be a non-empty string'
                });
            }
            
            const category = await Category.findByPk(id);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: 'Category not found'
                });
            }
            
            const existingCategory = await Category.findOne({
                where: { 
                    CategoryName: CategoryName.trim(),
                    id: { [req.app.get('models').Sequelize.Op.ne]: id }
                }
            });
            
            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    error: 'Category with this name already exists'
                });
            }
            
            await category.update({
                CategoryName: CategoryName.trim()
            });
            
            res.json({
                success: true,
                category: category,
                message: 'Category updated successfully'
            });
            
        } catch (error) {
            console.error('Category controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update category',
                details: error.message
            });
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { Category, Location } = req.app.get('models');
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid category ID provided'
                });
            }
            
            const category = await Category.findByPk(id);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: 'Category not found'
                });
            }
            
            const locationsCount = await Location.count({
                where: { Categories: id }
            });
            
            if (locationsCount > 0) {
                return res.status(409).json({
                    success: false,
                    error: `Cannot delete category. There are ${locationsCount} locations associated with this category.`
                });
            }
            
            await category.destroy();
            
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
            
        } catch (error) {
            console.error('Category controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete category',
                details: error.message
            });
        }
    }
}

module.exports = new CategoryController();