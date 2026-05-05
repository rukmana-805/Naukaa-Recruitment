import Organization from "../models/Organization.model.js";

const verifyCompany = async (req, res, next) => {
  
    const company = await Organization.findById(req.params.id);

    if (!company) {
        return res.status(404).json({ success: false, message: "Company not found" });
    }

    if(company.status !== "verified") {
        return res.status(403).json({ success: false, message: "Company not verified yet" });
    }
    
    next();

};

export default verifyCompany;