"""ValidaÃ§Ã£o independente com pandas dos nÃºmeros-chave do relatÃ³rio.

Executar:  python analise/08_validacao_pandas.py
Objetivo: confirmar com um motor distinto (pandas/scipy-free) as mÃ©tricas
apresentadas em RELATORIO.md, para detetar erros de implementaÃ§Ã£o em Node.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd

DATA = Path(r"C:/Users/USER/.copilot/session-state/1d9f2860-b80b-4db9-a8d2-29e144e5d4b3/files/recrutamento/json")

def load(name):
    return pd.DataFrame(json.loads((DATA / f"{name}.json").read_text(encoding="utf-8")))

cand = load("candidatos")
apps = load("candidaturas")
vaga = load("vagas")
cli = load("clientes")
rec = load("recrutadores")
ent = load("entrevistas")
inter = load("interacoes")
prop = load("propostas")
ct = load("contratacoes")
fb = load("feedback_clientes")
hist = load("historico_vagas")

def parse(s):
    iso = pd.to_datetime(s, format="%Y-%m-%d", errors="coerce")
    br = pd.to_datetime(s, format="%d/%m/%Y", errors="coerce")
    return iso.fillna(br)

for df, cols in [(apps, ["data_candidatura", "data_entrada_etapa"]), (vaga, ["data_abertura", "data_fecho"]),
                 (ent, ["data"]), (inter, ["data"]), (prop, ["data_proposta", "data_resposta"]),
                 (ct, ["data_contratacao", "data_saida"]), (fb, ["data_feedback"]),
                 (hist, ["data_evento"]), (cand, ["data_candidatura"])]:
    for c in cols:
        df[c] = parse(df[c])

def pct(a, b):
    return round(100 * a / b, 1) if b else 0.0

out = {}
out["registos_totais"] = int(sum(len(d) for d in [cand, apps, vaga, cli, rec, ent, inter, prop, ct, fb, hist]))
out["contratacoes_linhas"] = int(len(ct))
ct_u = ct.drop_duplicates(subset="id")
out["contratacoes_unicas"] = int(len(ct_u))
out["duplicados_exatos_ct"] = int(len(ct) - len(ct.drop_duplicates()))

# integridade
out["candidaturas_vaga_inexistente"] = int((~apps.id_vaga.isin(vaga.id)).sum())
out["contratacoes_vaga_divergente"] = int((ct_u.merge(apps[["id", "id_vaga"]], left_on="id_candidatura", right_on="id", suffixes=("", "_app"))
                                           .eval("id_vaga != id_vaga_app")).sum())

# formatos
raw_ent = pd.DataFrame(json.loads((DATA / "entrevistas.json").read_text(encoding="utf-8")))
out["datas_ddmmyyyy_entrevistas"] = int(raw_ent.data.str.match(r"^\d{2}/\d{2}/\d{4}$").sum())
out["score_tecnico_acima_100"] = int((ent.score_tecnico > 100).sum())
out["score_tecnico_max"] = float(ent.score_tecnico.max())

# funil
fases = ent.groupby("id_candidatura").fase.agg(set)
out["cand_com_entrevista"] = int(len(fases))
for f in ["triagem", "entrevista_tecnica", "entrevista_cliente", "entrevista_final"]:
    out[f"com_{f}"] = int(fases.apply(lambda s: f in s).sum())
out["com_proposta"] = int(prop.id_candidatura.nunique())
out["propostas_aceites"] = int((prop.estado_proposta == "aceite").sum())
out["contratacoes"] = int(len(ct_u))

# contrataÃ§Ã£o sÃ³ a partir da fase cliente
hired = set(ct_u.id_candidatura)
fase_max = fases.apply(lambda s: ["triagem", "entrevista_tecnica", "entrevista_cliente", "entrevista_final"][max([i for i, f in enumerate(["triagem", "entrevista_tecnica", "entrevista_cliente", "entrevista_final"]) if f in s], default=-1)] if s else "sem")
out["contratados_que_atingiram_final"] = int(sum(1 for cid in hired if cid in fase_max.index and fase_max[cid] == "entrevista_final"))

# coerÃªncia
out["etapa_atual_igual_fase_max"] = int((apps.set_index("id").etapa_atual.reindex(fase_max.index) == fase_max).sum())
out["etapa_atual_match_pct"] = pct(out["etapa_atual_igual_fase_max"], len(apps))
out["candidatos_marcados_contratado"] = int((cand.estado == "contratado").sum())
out["candidatos_realmente_contratados"] = int(apps.set_index("id").loc[list(hired), "id_candidato"].nunique())

# retenÃ§Ã£o
out["ret90_pct"] = pct(ct_u.retencao_90_dias.eq(True).sum(), ct_u.retencao_90_dias.notna().sum())
out["ret180_pct"] = pct(ct_u.retencao_180_dias.eq(True).sum(), ct_u.retencao_180_dias.notna().sum())

# salÃ¡rios
p = prop.merge(apps[["id", "id_vaga"]], left_on="id_candidatura", right_on="id").merge(vaga[["id", "salario_min", "salario_max"]], left_on="id_vaga", right_on="id")
pos = (p.salario_oferecido - p.salario_min) / (p.salario_max - p.salario_min)
out["propostas_com_banda"] = int(pos.notna().sum())
out["propostas_abaixo_min_pct"] = pct((pos < 0).sum(), pos.notna().sum())
out["propostas_acima_max_pct"] = pct((pos > 1).sum(), pos.notna().sum())
out["aceitacao_abaixo_min_pct"] = pct((p.loc[pos < 0, "estado_proposta"] == "aceite").sum(), (pos < 0).sum())
out["aceitacao_dentro_banda_pct"] = pct((p.loc[(pos >= 0) & (pos <= 1), "estado_proposta"] == "aceite").sum(), ((pos >= 0) & (pos <= 1)).sum())
sen = {"junior": 0, "mid": 1, "senior": 2, "lead": 3}
out["salario_min_medio_junior"] = float(vaga.loc[vaga.senioridade == "junior", "salario_min"].mean())
out["salario_min_medio_mid"] = float(vaga.loc[vaga.senioridade == "mid", "salario_min"].mean())

# tempos
ct2 = ct_u.merge(apps[["id", "data_candidatura"]], left_on="id_candidatura", right_on="id")
tth_recalc = (ct2.data_contratacao - ct2.data_candidatura).dt.days
out["tth_mediana"] = int(tth_recalc.median())
out["tth_media"] = round(float(tth_recalc.mean()), 1)
out["tth_min"], out["tth_max"] = int(tth_recalc.min()), int(tth_recalc.max())

# correlaÃ§Ãµes
def corr(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    m = ~np.isnan(x) & ~np.isnan(y)
    return round(float(np.corrcoef(x[m], y[m])[0, 1]), 3)

h = ct_u.merge(cand, left_on=ct_u.id_candidatura.map(apps.set_index("id").id_candidato), right_on="id")
out["corr_exp_expectativa"] = corr(cand.anos_experiencia, cand.expectativa_salarial)
out["corr_exp_salario_final"] = corr(h["anos_experiencia"], h.salario_final)
out["corr_satisfacao_desempenho"] = corr(fb.satisfacao, fb.desempenho_percebido)

# uniformidade das interaÃ§Ãµes
def chi_uniform(s):
    counts = s.value_counts()
    exp = len(s) / len(counts)
    return round(float(((counts - exp) ** 2 / exp).sum()), 1), len(counts) - 1
out["chi2_interacoes_tipo"], out["df"] = chi_uniform(inter.tipo)
out["chi2_interacoes_resultado"], _ = chi_uniform(inter.resultado)
out["feedback_dia_2025_12_31"] = int((fb.data_feedback == pd.Timestamp("2025-12-31")).sum())
out["proposta_respondida_apos_contratacao"] = int((prop.data_resposta > prop.id_candidatura.map(ct_u.set_index("id_candidatura").data_contratacao)).sum())
out["feedback_anterior_contratacao"] = int(fb.merge(
    ct_u[["id", "id_candidatura", "data_contratacao"]],
    left_on="id_contratacao",
    right_on="id",
).eval("data_feedback < data_contratacao").sum())
out["candidatos_com_mais_de_uma_contratacao"] = int(
    ct_u["id_candidatura"].map(apps.set_index("id").id_candidato).value_counts().gt(1).sum()
)

print(json.dumps(out, indent=2, ensure_ascii=False, default=float))
