from sklearn.linear_model import LinearRegression
import numpy as np
import streamlit as st
import requests
import pandas as pd
import psycopg2
import os
import re
from datetime import datetime, timedelta

st.set_page_config(page_title="IA - SGIP", page_icon="📈", layout="wide")

st.title("🤖 Prediccion de Demanda - Metroica")
st.caption("Entrena, predice y guarda automaticamente en PostgreSQL.")

API_URL = "http://localhost:8080/api/v1/inteligencia/datos-entrenamiento"
DB_URL = os.getenv("DB_URL", "postgresql://postgres:9629@localhost:5432/metroDB")

@st.cache_data(ttl=60)
def cargar_datos():
    try:
        r = requests.get(API_URL, timeout=10)
        if r.status_code != 200:
            st.error(f"Error HTTP {r.status_code}: {r.text}")
            return None
        datos = r.json()
        if not datos:
            st.warning("No hay movimientos de SALIDA en la base de datos.")
            return None
        df = pd.DataFrame(datos)
        df["fecha"] = pd.to_datetime(
            df["fecha"].astype(str)
            .str.replace(r"\.\d+", "", regex=True)
            .str.replace(r"(Z|[+-]\d{2}:?\d{2})$", "", regex=True)
        )
        return df
    except Exception as e:
        st.error(f"Error de conexion al backend: {e}")
        return None

def guardar_prediccion(conn, producto_id, nombre, semana_inicio, cant, confianza):
    semana_fin = semana_inicio + timedelta(days=6)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO predicciones_demanda
                    (producto_id, semana_inicio, semana_fin, cantidad_predicha, confianza, modelo_version)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (producto_id, semana_inicio)
                DO UPDATE SET cantidad_predicha = EXCLUDED.cantidad_predicha,
                              confianza = EXCLUDED.confianza,
                              modelo_version = EXCLUDED.modelo_version,
                              generado_en = NOW()
            """, (str(producto_id), semana_inicio.date(), semana_fin.date(), cant, round(float(confianza), 4), 'v1.0-linreg'))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        st.error(f"Error al guardar prediccion de {nombre}: {e}")
        return False

df = cargar_datos()

if df is not None and not df.empty:
    st.success(f"✅ {len(df)} movimientos SALIDA cargados del backend.")

    df["semana"] = df["fecha"].dt.to_period("W-MON").dt.start_time

    agrupado = (
        df.groupby(["productoId", "productoNombre", "semana"])["cantidad"]
        .sum()
        .reset_index()
        .rename(columns={"cantidad": "total_vendido"})
    )

    semana_min = agrupado["semana"].min()
    agrupado["semana_num"] = ((agrupado["semana"] - semana_min) / timedelta(days=7)).astype(int)

    conn = psycopg2.connect(DB_URL)
    total_predichos = 0

    for pid in agrupado["productoId"].unique():
        sub = agrupado[agrupado["productoId"] == pid].sort_values("semana")
        nombre = sub["productoNombre"].iloc[0]

        if len(sub) < 2:
            st.info(f"⏭ {nombre}: datos insuficientes ({len(sub)} semana(s))")
            continue

        st.subheader(f"📦 {nombre}", divider="gray")

        col1, col2 = st.columns([1, 2])
        with col1:
            display_df = sub[["semana", "total_vendido"]].copy()
            display_df["semana"] = display_df["semana"].dt.strftime("%d/%m/%Y")
            st.dataframe(display_df, use_container_width=True, hide_index=True)
        with col2:
            chart_data = sub[["semana", "total_vendido"]].copy()
            chart_data["semana"] = chart_data["semana"].dt.strftime("%Y-%m-%d")
            st.line_chart(chart_data, x="semana", y="total_vendido")

        X = sub[["semana_num"]]
        y = sub["total_vendido"]

        modelo = LinearRegression()
        modelo.fit(X, y)

        futura = sub["semana_num"].max() + 1
        semana_futura = sub["semana"].max() + timedelta(days=7)
        pred = modelo.predict([[futura]])[0]
        cant = max(0, int(round(pred)))
        r2 = modelo.score(X, y)

        c1, c2 = st.columns(2)
        c1.metric(
            label=f"Prediccion semana del {semana_futura.strftime('%d/%m/%Y')}",
            value=f"{cant} unidades",
            delta=f"R² = {r2:.2f}",
        )
        c2.metric(label="Semanas analizadas", value=len(sub))
        st.caption(f"Modelo: LinearRegression | Semanas historicas: {len(sub)}")

        if guardar_prediccion(conn, pid, nombre, semana_futura, cant, max(0, r2)):
            total_predichos += 1

        st.divider()

    conn.close()
    st.success(f"✅ {total_predichos} predicciones guardadas en PostgreSQL.")

else:
    st.warning("El backend no tiene movimientos de SALIDA. Registra algunas salidas primero.")