export default function castMonogoID(_doc: any, ret: Record<string, unknown>) {
    ret.id = (ret._id as { toString(): string }).toString();
    delete ret._id;
    return ret;
}