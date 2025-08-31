import Skill from "../models/Skill.js";

export const addSkill = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const skill = await Skill.create({ title });
        res.status(201).json(skill);
    } catch (error) {
        console.error("Error adding skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const skill = await Skill.findByPk(id);
        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }

        skill.title = title;
        await skill.save();

        res.status(200).json(skill);
    } catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteSkill = async (req, res) => {
    try {
        const { id } = req.params;

        const skill = await Skill.findByPk(id);
        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }

        await skill.destroy();
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.findAll();
        res.status(200).json(skills);
    } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}