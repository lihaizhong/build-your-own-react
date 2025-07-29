/**
 * 用于标识不同类型的副作用
 */

export type Flags = number;
// 没有任何标记
export const NoFlags = 0b00000000;
// 执行工作
export const PerformedWork = 0b00000001;
// 插入标记
export const Placement = 0b00000010;
// 更新标记
export const Update = 0b00000100;
// 删除标记
export const Deletion = 0b00001000;
