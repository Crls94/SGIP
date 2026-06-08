import unittest

try:
    import pandas as pd
    from ia_prediccion import (
        entrenar_prediccion_producto,
        normalizar_confianza,
        preparar_ventas_semanales,
    )
    IA_DEPS_AVAILABLE = True
except ModuleNotFoundError:
    IA_DEPS_AVAILABLE = False


class IaPrediccionTest(unittest.TestCase):
    @unittest.skipUnless(IA_DEPS_AVAILABLE, "Dependencias IA no instaladas. Ejecutar: pip install -r requirements.txt")
    def test_normalizar_confianza_limita_rango(self):
        self.assertEqual(normalizar_confianza(-0.5), 0.0)
        self.assertEqual(normalizar_confianza(1.5), 1.0)
        self.assertEqual(normalizar_confianza(0.75), 0.75)

    @unittest.skipUnless(IA_DEPS_AVAILABLE, "Dependencias IA no instaladas. Ejecutar: pip install -r requirements.txt")
    def test_preparar_ventas_semanales_agrupa_por_producto_y_semana(self):
        df = pd.DataFrame([
            {"productoId": "p1", "productoNombre": "Arroz", "fecha": "2026-06-01", "cantidad": 2},
            {"productoId": "p1", "productoNombre": "Arroz", "fecha": "2026-06-02", "cantidad": 3},
            {"productoId": "p1", "productoNombre": "Arroz", "fecha": "2026-06-09", "cantidad": 4},
        ])

        result = preparar_ventas_semanales(df)

        self.assertEqual(len(result), 2)
        self.assertEqual(result.iloc[0]["total_vendido"], 5)
        self.assertIn("semana_num", result.columns)

    @unittest.skipUnless(IA_DEPS_AVAILABLE, "Dependencias IA no instaladas. Ejecutar: pip install -r requirements.txt")
    def test_entrenar_prediccion_requiere_dos_semanas(self):
        df = pd.DataFrame([
            {"semana_num": 0, "semana": pd.Timestamp("2026-06-01"), "total_vendido": 3},
        ])

        self.assertIsNone(entrenar_prediccion_producto(df))


if __name__ == "__main__":
    unittest.main()
