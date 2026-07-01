import {Request, Response} from "express"
import * as ApiService from '../services/Api.service'

export const getApi = async(req: Request, res: Response) => {
    try {
        const data = await ApiService.getApiData()
        res.status(200).json(data)
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
    }
}

export const scrapeProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { url } = req.body;
        
        if (!url) {
            res.status(400).json({ error: "URL is required" });
            return;
        }
        
        const productData = await ApiService.scrapeProductFromUrl(url);
        res.status(200).json({
            success: true,
            data: productData,
        });
    } catch (error) {
        console.error("Error scraping product:", error);
        res.status(500).json({ 
            success: false,
            error: error instanceof Error ? error.message : "Failed to scrape product" 
        });
    }
}