export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ success: false });
    }

    const { orderID, productId } = req.body;

    if (!orderID || !productId) {
        return res.status(400).json({ success: false });
    }

    try {
        // 🔥 for now (same logic mo)
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false });
    }
}