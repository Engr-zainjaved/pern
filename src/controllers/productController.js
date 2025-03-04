import { psql } from "../config/db.js";

export const getProducts = async (req, res) => {
    try {
        const { rows: products } = await psql.query(`
            SELECT * FROM products
            ORDER BY created_at DESC;
        `);

        console.log('products', products);
        res.status(200).json({ success: true, data: products });

    } catch (error) {
        console.log('error in getProducts: ', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price } = req.body;

        if (!name || !description || !price) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const { rows: newProduct } = await psql.query(`
            INSERT INTO products (name, description, price)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [name, description, price]);

        res.status(201).json({ success: true, data: newProduct[0] });

    } catch (error) {
        console.log('error in createProduct: ', error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });

    }
};

export const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { rows: product } = await psql.query(`
            SELECT * FROM products
            WHERE id = ${id};
        `);

        if (!product.length) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, data: product[0] });

    } catch (error) {
        console.log('error in getProduct: ', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;

        if (!name && !description && !price) {
            return res.status(400).json({ success: false, error: 'At least one field is required' });
        }

        const fields = [];
        if (name) fields.push(`name = '${name}'`);
        if (description) fields.push(`description = '${description}'`);
        if (price) fields.push(`price = ${price}`);

        const { rows: updatedProduct } = await psql.query(`
            UPDATE products
            SET ${fields.join(', ')}
            WHERE id = ${id}
            RETURNING *;
        `);

        if (!updatedProduct.length) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, data: updatedProduct[0] });

    } catch (error) {
        console.log('error in updateProduct: ', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { rows: deletedProduct } = await psql.query(`
            DELETE FROM products
            WHERE id = ${id}
            RETURNING *;
        `);

        if (!deletedProduct.length) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, message: "Product deleted" });

    } catch (error) {
        console.log('error in deleteProduct: ', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
