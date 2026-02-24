-- ============================================================
-- STACKWORLD - Seed 005: 상점 아이템
-- 업그레이드 6종 / 소모품 5종 / 스킬 2종 / 수식어 3종 / 장비(치장) 5종
-- ============================================================

INSERT INTO public.shop_items (item_key, item_type, name, description, price, effect_data, max_level, rarity)
VALUES

-- ──────────── 영구 업그레이드 (max_level 5) ────────────
('UPG_CRIT_BOOST',   'upgrade', '크리티컬 강화',
 'CRITICAL 판정 임계값을 0.02 낮춰 크리티컬 발생 확률 상승. 최대 5레벨.',
 50,  '{"crit_threshold_delta": -0.02}', 5, 'common'),

('UPG_FUMBLE_SHIELD', 'upgrade', '펌블 방어',
 'FUMBLE 판정 임계값을 0.02 높여 펌블 발생 확률 감소. 최대 5레벨.',
 40,  '{"fumble_threshold_delta": 0.02}', 5, 'common'),

('UPG_TIME_EFFICIENCY', 'upgrade', '작업 효율화',
 'work 1회당 TIME 소모를 1 감소. 최대 5레벨.',
 60,  '{"time_cost_reduction": 1}', 5, 'rare'),

('UPG_RISK_DAMPENER', 'upgrade', '리스크 완화',
 'RISK 사고 발생 확률을 20% 감소. 최대 3레벨.',
 80,  '{"incident_prob_multiplier": 0.8}', 3, 'rare'),

('UPG_XP_AMPLIFIER', 'upgrade', 'XP 증폭기',
 '모든 XP 획득량 10% 증가. 최대 5레벨.',
 100, '{"xp_multiplier_bonus": 0.1}', 5, 'epic'),

('UPG_QUAL_BASELINE', 'upgrade', '품질 기반 강화',
 '런 시작 시 QUALITY 초기값 +5. 최대 3레벨.',
 70,  '{"starting_quality_bonus": 5}', 3, 'rare'),

-- ──────────── 소모품 (max_level 1, 여러 개 구매 가능) ────────────
('ITEM_COFFEE', 'consumable', '강화 커피',
 'TIME +20 즉시 회복 + FLOW STATE 3턴 (성공률 +15%)',
 30,  '{"time_bonus": 20, "effect": {"type": "flow_state", "magnitude": 0.15, "turns_left": 3}}', 1, 'common'),

('ITEM_RISK_SHIELD', 'consumable', 'RISK 방패',
 'RISK 사고 발생을 5회 work 동안 차단.',
 50,  '{"effect": {"type": "risk_shield", "magnitude": 1.0, "turns_left": 5}}', 1, 'rare'),

('ITEM_ENERGY_DRINK', 'consumable', '에너지 드링크',
 '3회 work 동안 성공 임계값 -0.05 (성공률 상승).',
 40,  '{"effect": {"type": "success_boost", "magnitude": 0.05, "turns_left": 3}}', 1, 'common'),

('ITEM_DEBUG_KIT', 'consumable', '디버그 키트',
 '즉시 QUALITY +15.',
 35,  '{"quality_bonus": 15}', 1, 'common'),

('ITEM_REFACTOR_SCROLL', 'consumable', '리팩터링 스크롤',
 '즉시 DEBT -20.',
 45,  '{"debt_reduction": 20}', 1, 'rare'),

-- ──────────── 스킬 언락 (1회 구매, 영구 커맨드 해금) ────────────
('SKILL_REFACTOR', 'skill', '리팩터링',
 'refactor 커맨드 해금. 런 중 사용 시 DEBT-20 (5-work 쿨다운).',
 200, '{"command": "refactor", "effect": {"debt_reduction": 20}, "cooldown_works": 5}', 1, 'epic'),

('SKILL_CODE_REVIEW', 'skill', '코드 리뷰',
 'code_review 커맨드 해금. 런 중 사용 시 RISK-15, QUAL+5 (4-work 쿨다운).',
 250, '{"command": "code_review", "effect": {"risk_reduction": 15, "quality_bonus": 5}, "cooldown_works": 4}', 1, 'epic'),

-- ──────────── 런 수식어 (런 시작 전 장착) ────────────
('MOD_SPEEDRUN', 'modifier', '스피드런 모드',
 '런 중 TIME 소모 +50%, 대신 모든 XP x2.0.',
 80,  '{"time_cost_multiplier": 1.5, "xp_multiplier": 2.0}', 1, 'rare'),

('MOD_SAFE_MODE', 'modifier', '안전 모드',
 '성공 임계값 -0.1 (더 쉬움), XP x0.8.',
 30,  '{"success_threshold_delta": -0.1, "xp_multiplier": 0.8}', 1, 'common'),

('MOD_CHALLENGE', 'modifier', '챌린지 모드',
 'CRIT 범위 확대 + FUMBLE 범위 확대, XP x2.5. 고위험 고보상.',
 120, '{"crit_threshold_delta": -0.1, "fumble_threshold_delta": 0.1, "xp_multiplier": 2.5}', 1, 'legendary'),

-- ──────────── 장비 / 치장 아이템 (avatar 비주얼 + 능력치 반영) ────────────
-- 저장 방식: character_upgrades (upgrade 타입, EQUIP_ 접두사로 구분)

('EQUIP_HEADPHONES', 'upgrade', '노이즈캔슬링 헤드폰',
 '성공한 work 1회마다 QUALITY +2. 집중력이 올라가 코드 품질이 향상됩니다. 최대 3레벨.',
 120, '{"quality_regen_per_work": 2}', 3, 'epic'),

('EQUIP_MECH_KEYBOARD', 'upgrade', '메카니컬 키보드',
 '성공 판정 임계값 -0.02/레벨. 빠르고 정확한 타이핑으로 성공률이 높아집니다. 최대 3레벨.',
 90,  '{"success_threshold_delta": -0.02}', 3, 'rare'),

('EQUIP_DUAL_MONITOR', 'upgrade', '듀얼 모니터',
 '런 시작 시 TIME +8/레벨. 넓은 화면에서 작업하면 초기 여유 시간이 늘어납니다. 최대 3레벨.',
 150, '{"starting_time_bonus": 8}', 3, 'epic'),

('EQUIP_HOODIE', 'upgrade', '개발자 후드티',
 '런 시작 시 RISK -3/레벨. 편안한 복장이 심리적 안정감을 줍니다. 최대 5레벨.',
 45,  '{"starting_risk_reduction": 3}', 5, 'common'),

('EQUIP_COFFEE_SETUP', 'upgrade', '프리미엄 커피 셋업',
 'work 1회마다 TIME +1 회복/레벨. 카페인이 지속적으로 집중력을 유지시킵니다. 최대 3레벨.',
 75,  '{"time_bonus_per_work": 1}', 3, 'rare')
;
