/** 장소 카테고리: 필터 칩 순서, 색, 한 글자 표시 */
export const PLACE_FILTERS = ['전체', '술집', '카페', '식당', '만화카페', '영화관'] as const

export const CAT_COLOR: Record<string, string> = {
  카페: 'var(--color-cat-cafe)', 식당: 'var(--color-cat-food)', 술집: 'var(--color-cat-bar)', 영화관: 'var(--color-cat-movie)', 만화카페: 'var(--color-cat-comic)',
}
export const CAT_SHORT: Record<string, string> = { 카페: '카', 식당: '식', 술집: '술', 영화관: '영', 만화카페: '만' }
