const adminAuth = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: '관리자 인증이 필요합니다' });
    }
    next();
};

export default adminAuth;
