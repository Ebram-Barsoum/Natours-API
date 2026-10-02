import multer from "multer";
import path from "path";
import fs from "fs";
import AppError from "../utils/appError";

interface GenerateMulterConfigProps {
    supportedFiles: string[];   // mimetype categories, e.g. "image", "video", "application"
    maxFileSizeInMB?: number;  // default 5 MB
    destination?: string;      // default "public/uploads"
    storageType: "disk" | "memory";
}

function generateMulterConfig({ supportedFiles, maxFileSizeInMB = 5, destination = "public/uploads", storageType = "disk" }: GenerateMulterConfigProps) {
    // if storage type is disk, create the destination directory if not exists 
    if (storageType === "disk") {
        fs.mkdirSync(destination, { recursive: true });
    }

    const storage = storageType === "disk" ?
        multer.diskStorage({
            destination: (req, file, callback) => {
                callback(null, destination);
            },
            filename: (req, file, callback) => {
                const ext = path.extname(file.originalname);
                const fname = path.basename(file.originalname, ext);
                const uniqueName = `${fname}-${Date.now()}${ext}`;

                callback(null, uniqueName);
            }
        }) :
        multer.memoryStorage();

    const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
        const [filetype] = file.mimetype.split('/');

        if (filetype && supportedFiles.includes(filetype)) {
            return callback(null, true)
        }

        callback(new AppError(`${file.fieldname} File type is not support!`, 400));
    }

    return {
        storage,
        fileFilter,
        limits: { fileSize: maxFileSizeInMB * 1024 * 1024 } // convert it to bytes
    }
}

type GetFileUploaderProps = ({ type: "single", propertyName: string, storageType?: "disk" | "memory" } & GenerateMulterConfigProps) |
    ({ type: "array", propertyName: string, maxCount?: number, storageType?: "disk" | "memory" } & GenerateMulterConfigProps) |
    ({ type: "mix", mixConfig: { name: string, maxCount: number }[], storageType?: "disk" | "memory" } & GenerateMulterConfigProps);

function getFileUploader(props: GetFileUploaderProps) {
    const { type, supportedFiles, maxFileSizeInMB, destination, storageType = "disk" } = props;
    const upload = multer(generateMulterConfig({
        supportedFiles,
        ...(maxFileSizeInMB !== undefined && { maxFileSizeInMB }),
        ...(destination !== undefined && { destination }),
        storageType
    }));

    switch (type) {
        case "single":
            return upload.single(props.propertyName);
        case "array":
            return upload.array(props.propertyName, props.maxCount ?? 10);
        case "mix":
            return upload.fields(props.mixConfig);
        default:
            const _exhaustive: never = type;
            throw new Error(`Unknown upload type: ${_exhaustive}`);
    }
}

export { getFileUploader };