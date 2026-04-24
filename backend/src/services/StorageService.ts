import { supabase } from '../config/supabaseClient';
import fs from 'fs';
import path from 'path';

export class StorageService {
    /**
     * Uploads a file to Supabase Storage and returns the public URL.
     * @param file The multer file object
     * @param bucket The Supabase bucket name (defaults to 'profiles')
     * @param folder The folder inside the bucket (defaults to 'logos')
     */
    static async uploadFile(file: Express.Multer.File, bucket: string = 'profiles', folder: string = 'logos'): Promise<string> {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn('Supabase not configured, falling back to local path');
            return `/uploads/profiles/${file.filename}`;
        }

        try {
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
            const fileBuffer = fs.readFileSync(file.path);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, fileBuffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) {
                console.error('Supabase Storage Upload Error:', error);
                throw new Error(`Cloud storage upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            // Clean up the local file after successful upload to Supabase
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.warn('Failed to delete temporary local file:', unlinkErr);
            }

            return urlData.publicUrl;
        } catch (err: any) {
            console.error('Storage Service Error:', err);
            throw err;
        }
    }
}
