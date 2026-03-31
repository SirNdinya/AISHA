import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export class BaseController {
    protected table: string;

    constructor(table: string) {
        this.table = table;
    }

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query(`SELECT * FROM ${this.table}`);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows,
            });
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await pool.query(`SELECT * FROM ${this.table} WHERE id = $1`, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Record not found',
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    };
}
