const Category = require('../models/Category');

const defaultSeedCategories = [
  {
    name: 'Academics & Coursework',
    description: 'Core subject lectures, reading materials, and general study',
    color: '#2563eb',
    isSystemDefault: true
  },
  {
    name: 'Assignments & Homework',
    description: 'Homework submissions, problem sets, and lab exercises',
    color: '#059669',
    isSystemDefault: true
  },
  {
    name: 'Projects & Development',
    description: 'Mini and major software coding projects and reports',
    color: '#7c3aed',
    isSystemDefault: true
  },
  {
    name: 'Exams & Revision',
    description: 'Midterms, semester finals, quizzes, and viva preparation',
    color: '#d97706',
    isSystemDefault: true
  },
  {
    name: 'Personal & General',
    description: 'Certifications, self-study, and personal productivity goals',
    color: '#64748b',
    isSystemDefault: true
  }
];

exports.getCategories = async (req, res) => {
  try {
    // If no system default categories exist in the database, automatically seed them
    const defaultCount = await Category.countDocuments({ isSystemDefault: true });
    if (defaultCount === 0) {
      await Category.insertMany(defaultSeedCategories);
    }

    const categories = await Category.find({
      $or: [
        { isSystemDefault: true },
        { createdBy: req.user._id }
      ]
    }).sort({ isSystemDefault: -1, name: 1 });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const isSystemDefault = req.user.role === 'admin' && req.body.isSystemDefault === true;

    const category = await Category.create({
      name,
      description: description || '',
      color: color || '#2563eb',
      createdBy: req.user._id,
      isSystemDefault
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (req.user.role !== 'admin' && String(category.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to edit this category' });
    }

    if (req.body.name) category.name = req.body.name;
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.body.color) category.color = req.body.color;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (category.isSystemDefault && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete default category' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
};
