from sklearn.linear_model import LinearRegression
import numpy as np
import streamlit as st
import requests
import pandas as pd
import os
import re
from datetime import timedelta

API_URL = os.getenv("IA_API_URL", "http://localhost:8080/api/v1/inteligencia/datos-entrenamiento")
LOGIN_URL = os.getenv("IA_LOGIN_URL", "http://localhost:8080/api/v1/auth/login")
PREDICCIONES_URL = os.getenv("IA_PREDICCIONES_URL", "http://localhost:8080/api/v1/inteligencia/predicciones")
IA_API_TOKEN = os.getenv("IA_API_TOKEN", "")
IA_API_EMAIL = os.getenv("IA_API_EMAIL", "admin@metroica.com")
IA_API_PASSWORD = os.getenv("IA_API_PASSWORD", "admin123")
IA_ENV = os.getenv("IA_ENV", "demo").lower()


def normalizar_confianza(r2):
    """Normaliza R2 al rango persistible 0..1."""
    if r2 is None or np.isnan(r2):
        return 0.0
    return max(0.0, min(float(r2), 1.0))


def preparar_ventas_semanales(df):
    """Agrupa movimientos de salida por producto y semana para entrenar el modelo."""
    if df is None or df.empty:
        return pd.DataFrame()

    requerido = {"productoId", "productoNombre", "fecha", "cantidad"}
    faltantes = requerido.difference(df.columns)
    if faltantes:
        raise ValueError(f"Faltan columnas requeridas: {', '.join(sorted(faltantes))}")

    data = df.copy()
    data["fecha"] = pd.to_datetime(data["fecha"])
    data["semana"] = data["fecha"].dt.to_period("W-SUN").dt.start_time

    agrupado = (
        data.groupby(["productoId", "productoNombre", "semana"])["cantidad"]
        .sum()
        .reset_index()
        .rename(columns={"cantidad": "total_vendido"})
    )

    semana_min = agrupado["semana"].min()
    agrupado["semana_num"] = ((agrupado["semana"] - semana_min) / timedelta(days=7)).astype(int)
    return agrupado


def calcular_tendencia_porcentaje(sub):
    if len(sub) < 2:
        return 0.0
    primera = float(sub.iloc[0]["total_vendido"])
    ultima = float(sub.iloc[-1]["total_vendido"])
    if primera == 0:
        return 0.0
    return round(((ultima - primera) / primera) * 100, 2)


def calcular_riesgo(stock_actual, punto_pedido, cantidad_predicha):
    stock = int(stock_actual or 0)
    punto = int(punto_pedido or 0)
    prediccion = int(cantidad_predicha or 0)
    if prediccion > stock:
        return "ALTO"
    if stock - prediccion <= max(1, punto // 2):
        return "MEDIO"
    return "BAJO"


def entrenar_prediccion_producto(sub):
    """Entrena regresion lineal para un producto y retorna semana futura, cantidad y confianza."""
    if len(sub) < 2:
        return None

    X = sub[["semana_num"]]
    y = sub["total_vendido"]

    modelo = LinearRegression()
    modelo.fit(X, y)

    futura = sub["semana_num"].max() + 1
    semana_futura = sub["semana"].max() + timedelta(days=7)
    pred = modelo.predict([[futura]])[0]
    cantidad = max(0, int(round(pred)))
    confianza = normalizar_confianza(modelo.score(X, y))

    tendencia = calcular_tendencia_porcentaje(sub)

    return semana_futura, cantidad, confianza, tendencia


def obtener_metadata_producto(df, producto_id):
    fila = df[df["productoId"] == producto_id].iloc[0]
    return {
        "sku": fila.get("sku", ""),
        "categoria": fila.get("categoriaNombre", "Sin categoria"),
        "stockActual": int(fila.get("stockActual", 0) or 0),
        "puntoPedido": int(fila.get("puntoPedido", 0) or 0),
    }

@st.cache_data(ttl=60)
def cargar_datos():
    try:
        headers = obtener_headers_api()
        r = requests.get(API_URL, headers=headers, timeout=10)
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


def obtener_headers_api():
    if IA_ENV == "prod" and not IA_API_TOKEN.strip():
        st.error("En produccion configure IA_API_TOKEN para el modulo IA.")
        return {}
    token = IA_API_TOKEN.strip() or obtener_token_login()
    return {"Authorization": f"Bearer {token}"} if token else {}


def obtener_token_login():
    try:
        r = requests.post(
            LOGIN_URL,
            json={"email": IA_API_EMAIL, "password": IA_API_PASSWORD},
            timeout=10,
        )
        if r.status_code != 200:
            st.error(f"No se pudo autenticar IA contra el backend: HTTP {r.status_code}")
            return ""
        return r.json().get("token", "")
    except Exception as e:
        st.error(f"Error de autenticacion IA: {e}")
        return ""

def guardar_prediccion(headers, producto_id, nombre, semana_inicio, cant, confianza):
    try:
        payload = {
            "productoId": str(producto_id),
            "semanaInicio": semana_inicio.date().isoformat(),
            "cantidadPredicha": int(cant),
            "confianza": round(float(confianza), 4),
            "modeloVersion": "v1.0-linreg",
        }
        r = requests.post(PREDICCIONES_URL, headers=headers, json=payload, timeout=10)
        if r.status_code not in (200, 201):
            st.error(f"Error al guardar prediccion de {nombre}: HTTP {r.status_code} - {r.text}")
            return False
        return True
    except Exception as e:
        st.error(f"Error al guardar prediccion de {nombre}: {e}")
        return False

def main():
    st.set_page_config(page_title="IA - SGIP", page_icon="📈", layout="wide")
    st.title("🤖 Prediccion de Demanda - Metroica")
    st.caption("Entrena, predice y guarda automaticamente mediante el backend SGIP.")

    df = cargar_datos()

    if df is None or df.empty:
        st.warning("El backend no tiene movimientos de SALIDA. Registra algunas salidas primero.")
        return

    st.success(f"✅ {len(df)} movimientos SALIDA cargados del backend.")
    agrupado = preparar_ventas_semanales(df)

    headers = obtener_headers_api()
    if not headers:
        st.error("No se pudo autenticar el modulo IA contra el backend.")
        return

    total_predichos = 0

    for pid in agrupado["productoId"].unique():
        sub = agrupado[agrupado["productoId"] == pid].sort_values("semana")
        nombre = sub["productoNombre"].iloc[0]
        resultado = entrenar_prediccion_producto(sub)

        if resultado is None:
            st.info(f"⏭ {nombre}: datos insuficientes ({len(sub)} semana(s))")
            continue

        semana_futura, cant, confianza, tendencia = resultado
        meta = obtener_metadata_producto(df, pid)
        riesgo = calcular_riesgo(meta["stockActual"], meta["puntoPedido"], cant)

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

        c1, c2 = st.columns(2)
        c1.metric(
            label=f"Prediccion semana del {semana_futura.strftime('%d/%m/%Y')}",
            value=f"{cant} unidades",
            delta=f"R² = {confianza:.2f}",
        )
        c2.metric(label="Riesgo de quiebre", value=riesgo, delta=f"Tendencia {tendencia:+.1f}%")
        st.caption(
            f"SKU: {meta['sku']} | Categoria: {meta['categoria']} | "
            f"Stock actual: {meta['stockActual']} | Punto de pedido: {meta['puntoPedido']} | "
            f"Modelo: LinearRegression | Semanas historicas: {len(sub)}"
        )

        if guardar_prediccion(headers, pid, nombre, semana_futura, cant, confianza):
            total_predichos += 1

        st.divider()

    st.success(f"✅ {total_predichos} predicciones guardadas mediante el backend SGIP.")


if __name__ == "__main__":
    main()
