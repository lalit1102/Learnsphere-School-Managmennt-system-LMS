import Role from "../models/role.js";

export const getRoles = async (req, res) => {
  const roles = await Role.find();
  res.json(roles);
};

export const getRole = async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ message: "Role not found" });
  res.json(role);
};

export const createRole = async (req, res) => {
  const { name, permissions } = req.body;
  const role = new Role({ name, permissions });
  await role.save();
  res.status(201).json(role);
};

export const updateRole = async (req, res) => {
  const { permissions } = req.body;
  const role = await Role.findByIdAndUpdate(req.params.id, { permissions }, { new: true });
  if (!role) return res.status(404).json({ message: "Role not found" });
  res.json(role);
};
