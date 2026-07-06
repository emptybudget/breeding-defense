"""v3 R4/R6 밸런스 몬테카를로 검증 (기획 수치 그대로)"""
import random
from statistics import mean, median

TRIALS = 100_000
rng = random.Random(20260706)

# ── Sim A: 동계열 G0 4마리 확보까지 필요한 소환 수 ──────────────────────
# 소환 = T1 6종 균등(계열당 2종). 사다리에는 "같은 계열" G0 4마리 필요(동시 아님, 누적).
def sim_summons_to_4_same_family(r):
    counts = [0, 0, 0]
    n = 0
    while max(counts) < 4:
        counts[r.randrange(6) // 2] += 1
        n += 1
    return n

A = sorted(sim_summons_to_4_same_family(rng) for _ in range(TRIALS))
def pct(arr, p): return arr[int(len(arr) * p)]
# 소환 비용: 10,12,14,...30 상한 (SUMMON_BASE=10, INC=2, MAX=30)
def summon_cost(n): return sum(min(10 + 2 * i, 30) for i in range(n))
print("=== A. 동계열 G0 4마리 확보 소환 수 ===")
print(f"평균 {mean(A):.1f} / 중앙값 {median(A):.0f} / p90 {pct(A,0.9)} / p99 {pct(A,0.99)}")
print(f"필요 골드: 중앙값 {summon_cost(int(median(A)))}G / p90 {summon_cost(pct(A,0.9))}G")
print(f"수입 가정(+2G/s, 킬 무시): 중앙값 골드 도달 {summon_cost(int(median(A)))/2:.0f}s, 시작골드 100 감안 {(summon_cost(int(median(A)))-100)/2:.0f}s")

# ── Sim B: 교배 예산 6회 내 Gen3 도달 (사다리 + 희귀 변이 +1) ──────────
# 동계열: Gen=max+1, 변이 15% (12/2.5/0.5), 희귀=Gen 추가 +1
# 이계열: Gen=max, 변이 30% (24/5/1)
def mut_roll(r, cross):
    x = r.random() * 100
    if cross:  # 24/5/1
        return 'legend' if x < 1 else 'rare' if x < 6 else 'common' if x < 30 else None
    return 'legend' if x < 0.5 else 'rare' if x < 3 else 'common' if x < 15 else None

def sim_game(r, budget=6, summons_avail=14):
    """전략: 사다리 우선. 동계열 G0 나올 때까지 소환 스트림 소비, 남는 타계열은 방치.
    반환: (Gen3 도달 여부, 사용한 교배 수, 사용한 소환 수)"""
    stream = [r.randrange(6) // 2 for _ in range(summons_avail)]
    # 목표 계열 = 스트림 앞부분에서 가장 먼저 2마리 모이는 계열
    counts = [0, 0, 0]; ladder_fam = None; used = 0
    pool = 0  # 목표 계열 보유 G0 수
    gen = None  # 사다리 최상단 Gen
    breeds = 0
    for fam in stream:
        used += 1
        counts[fam] += 1
        if ladder_fam is None:
            if counts[fam] == 2:
                ladder_fam = fam
                pool = 2
        elif fam == ladder_fam:
            pool += 1
        # 교배 시도
        while breeds < budget:
            if gen is None:
                if pool >= 2:
                    pool -= 2; breeds += 1
                    gen = 1 + (1 if mut_roll(r, False) == 'rare' else 0) + (0)  # legend도 특성만, Gen은 rare만 +1
                else: break
            else:
                if pool >= 1:
                    pool -= 1; breeds += 1
                    gen = gen + 1 + (1 if mut_roll(r, False) == 'rare' else 0)
                else: break
            if gen >= 3: return True, breeds, used
        if gen is not None and gen >= 3: return True, breeds, used
    return (gen or 0) >= 3, breeds, used

res = [sim_game(rng) for _ in range(TRIALS)]
ok = [x for x in res if x[0]]
print("\n=== B. 소환 14회·예산 6회 내 Gen3 사다리 ===")
print(f"도달률 {len(ok)/TRIALS*100:.1f}% / 평균 교배 {mean(x[1] for x in ok):.2f}회 / 평균 소환 소비 {mean(x[2] for x in ok):.1f}회")
for s in (10, 12, 16, 20):
    r2 = [sim_game(rng, summons_avail=s) for _ in range(20_000)]
    print(f"  소환 {s}회 가용 시 도달률 {sum(1 for x in r2 if x[0])/200:.1f}%")

# ── Sim C: 전략 비교 (지배 시퀀스 유일성) ──────────────────────────────
# S1 순수 사다리 vs S2 하이브리드(대기 중 이계열 도박 — 희귀 시 Gen 선점)
def sim_hybrid(r, budget=6, summons_avail=14):
    stream = [r.randrange(6) // 2 for _ in range(summons_avail)]
    counts = [0, 0, 0]; have = [0, 0, 0]
    gen_unit = 0; breeds = 0; used = 0
    for fam in stream:
        used += 1; have[fam] += 1; counts[fam] += 1
        # 사다리: 최다 보유 계열로
        best = max(range(3), key=lambda f: have[f])
        while breeds < budget:
            if gen_unit == 0 and have[best] >= 2:
                have[best] -= 2; breeds += 1
                gen_unit = 1 + (1 if mut_roll(r, False) == 'rare' else 0)
            elif gen_unit > 0 and have[best] >= 1:
                have[best] -= 1; breeds += 1
                gen_unit += 1 + (1 if mut_roll(r, False) == 'rare' else 0)
            elif gen_unit > 0 and sum(have) >= 1 and breeds <= budget - 2:
                # 이계열 도박: 타계열 G0을 사다리 유닛과 교배 (Gen 유지, 30% 변이)
                f2 = next(f for f in range(3) if have[f] > 0)
                have[f2] -= 1; breeds += 1
                if mut_roll(r, True) == 'rare': gen_unit += 1
            else:
                break
            if gen_unit >= 3: return True, breeds, used
    return gen_unit >= 3, breeds, used

h = [sim_hybrid(rng) for _ in range(TRIALS)]
hok = [x for x in h if x[0]]
print("\n=== C. 하이브리드(사다리+이계열 도박) 전략 ===")
print(f"도달률 {len(hok)/TRIALS*100:.1f}% / 평균 교배 {mean(x[1] for x in hok):.2f}회 / 평균 소환 소비 {mean(x[2] for x in hok):.1f}회")

# ── Sim D: 변이 등급 분포 + 판당 체감 ──────────────────────────────────
n_rare = n_leg = 0
N = 1_000_000
for _ in range(N):
    m = mut_roll(rng, False)
    n_rare += m == 'rare'; n_leg += m == 'legend'
print("\n=== D. 동계열 변이 분포 (100만회) ===")
print(f"희귀 {n_rare/N*100:.2f}% (기대 2.5) / 전설 {n_leg/N*100:.3f}% (기대 0.5)")
print(f"판당 교배 6회 기준: 희귀 없는 판 비율 {(1-0.025)**6*100:.0f}% / 전설 만나기까지 평균 {1/0.005/6:.0f}판(동계열만) ~ {1/0.01/6:.0f}판(이계열만)")
print(f"희귀 피티 8회: 판당 6회 예산이면 판 내 피티 발동 불가 → 영속 카운터 필수 확인")

# ── E. 혈통 일격 DPS vs Phase C 보스 (해석적) ──────────────────────────
t4_dps = 200  # PROGRESS 실측 기반
boss_c_hp = 685
for gen, period, label in ((0, 0, 'Gen0'), (2, 4, 'Gen2(4회당)'), (3, 3, 'Gen3(3회당)'), (4, 2, 'Gen4(2회당)')):
    mult = 1 + (1 / period if period else 0)
    print(f"\n=== E. {label}: T4 DPS {t4_dps*mult:.0f} → Phase C({boss_c_hp}HP) 처치 {boss_c_hp/(t4_dps*mult):.1f}s (목표 3~5s)")
