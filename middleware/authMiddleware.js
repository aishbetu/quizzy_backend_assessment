import jwt from "jsonwebtoken";

export const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: "Invalid or expired token" });
        }
        if (!allowedRoles.includes(decoded.role)) {
          console.log("User role not allowed:", decoded.role);
          return res.status(403).json({ error: "Access denied" });
        }
        // Attach decoded payload (id, email, role) to request
        req.user = decoded;
        next();
      });
    } catch (err) {
      console.error("Token verification failed:", err);
      res.status(500).json({ error: "Token verification failed" });
    }
  };
};
