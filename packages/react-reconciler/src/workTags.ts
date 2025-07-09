export type Flags = number;

export const NoFlags = 0b00000000;
export const PerformedWork = 0b00000001;
// 插入标记
export const Placement = 0b00000010;
// 更新标记
export const Update = 0b00000100;
// 删除标记
export const Deletion = 0b00001000;
