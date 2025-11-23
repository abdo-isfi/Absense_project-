import Example from '../models/example.model.js';

// @desc    Get all examples
// @route   GET /api/examples
// @access  Public
export const getExamples = async (req, res) => {
  try {
    const examples = await Example.find();
    res.json(examples);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single example
// @route   GET /api/examples/:id
// @access  Public
export const getExampleById = async (req, res) => {
  try {
    const example = await Example.findById(req.params.id);
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }
    res.json(example);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new example
// @route   POST /api/examples
// @access  Public
export const createExample = async (req, res) => {
  try {
    const example = await Example.create(req.body);
    res.status(201).json(example);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update example
// @route   PUT /api/examples/:id
// @access  Public
export const updateExample = async (req, res) => {
  try {
    const example = await Example.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }
    res.json(example);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete example
// @route   DELETE /api/examples/:id
// @access  Public
export const deleteExample = async (req, res) => {
  try {
    const example = await Example.findByIdAndDelete(req.params.id);
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }
    res.json({ message: 'Example deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
