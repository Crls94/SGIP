package com.metroica.sgip_backend.reportes;

import com.metroica.sgip_backend.pedidos.Pedido;
import com.metroica.sgip_backend.pedidos.PedidoRepository;
import com.metroica.sgip_backend.productos.Producto;
import com.metroica.sgip_backend.productos.ProductoRepository;
import com.metroica.sgip_backend.seguridad.SecurityUtils;
import com.metroica.sgip_backend.seguridad.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
/**
 * Servicio de generación y descarga de reportes administrativos.
 * Construye archivos Excel/PDF y registra el historial de reportes generados.
 */
public class ReporteService {

    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final ReporteRepository reporteRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.reportes.dir:reportes}")
    private String reportesDir;

    @Transactional
    public byte[] generarReporteInventario(String formato) {
        String formatoNormalizado = normalizarFormato(formato);
        List<Producto> productos = productoRepository.findAll();
        byte[] contenido;

        if ("pdf".equals(formatoNormalizado)) {
            contenido = generarInventarioPDF(productos);
        } else {
            contenido = generarInventarioExcel(productos);
        }

        String parametrosJson = String.format("{\"formato\":\"%s\"}", formatoNormalizado);
        registrarReporte("INVENTARIO", formatoNormalizado, parametrosJson, contenido);
        return contenido;
    }

    @Transactional
    public byte[] generarReportePedidos(String formato, LocalDateTime fechaDesde, LocalDateTime fechaHasta) {
        String formatoNormalizado = normalizarFormato(formato);
        List<Pedido> pedidos = buscarPedidos(fechaDesde, fechaHasta);

        byte[] contenido;

        if ("pdf".equals(formatoNormalizado)) {
            contenido = generarPedidosPDF(pedidos);
        } else {
            contenido = generarPedidosExcel(pedidos);
        }

        StringBuilder sb = new StringBuilder("{");
        sb.append("\"formato\":\"").append(formatoNormalizado).append("\"");
        if (fechaDesde != null) {
            sb.append(",\"fechaDesde\":\"").append(fechaDesde.toString()).append("\"");
        }
        if (fechaHasta != null) {
            sb.append(",\"fechaHasta\":\"").append(fechaHasta.toString()).append("\"");
        }
        sb.append("}");
        registrarReporte("PEDIDOS", formatoNormalizado, sb.toString(), contenido);
        return contenido;
    }

    private String normalizarFormato(String formato) {
        String normalizado = formato == null ? "xlsx" : formato.trim().toLowerCase();
        if (!"xlsx".equals(normalizado) && !"pdf".equals(normalizado)) {
            throw new IllegalArgumentException("Formato de reporte no soportado: " + formato);
        }
        return normalizado;
    }

    private List<Pedido> buscarPedidos(LocalDateTime fechaDesde, LocalDateTime fechaHasta) {
        if (fechaDesde != null && fechaHasta != null) {
            if (fechaDesde.isAfter(fechaHasta)) {
                throw new IllegalArgumentException("La fecha inicial no puede ser posterior a la fecha final");
            }
            return pedidoRepository.findByFechaIngresoBetweenOrderByFechaIngresoDesc(fechaDesde, fechaHasta);
        }
        if (fechaDesde != null) {
            return pedidoRepository.findByFechaIngresoGreaterThanEqualOrderByFechaIngresoDesc(fechaDesde);
        }
        if (fechaHasta != null) {
            return pedidoRepository.findByFechaIngresoLessThanEqualOrderByFechaIngresoDesc(fechaHasta);
        }
        return pedidoRepository.findAllByOrderByFechaIngresoDesc();
    }

    @Transactional(readOnly = true)
    public List<ReporteDTO> listarReportes() {
        return reporteRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(r -> new ReporteDTO(
                        r.getId(),
                        r.getTipo(),
                        r.getFormato(),
                        r.getParametros(),
                        r.getRutaArchivo(),
                        r.getCreatedAt(),
                        r.getUsuario() != null ? r.getUsuario().getEmail() : null,
                        r.getUsuario() != null ? r.getUsuario().getNombre() + " " + r.getUsuario().getApellido() : null
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] descargarReporte(UUID id) throws IOException {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        Path filePath = Paths.get(reporte.getRutaArchivo());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Archivo no encontrado en disco");
        }
        return Files.readAllBytes(filePath);
    }

    public String getContentType(UUID id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        return "pdf".equalsIgnoreCase(reporte.getFormato())
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    public String getFilename(UUID id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        return reporte.getTipo().toLowerCase() + "." + reporte.getFormato().toLowerCase();
    }

    private void registrarReporte(String tipo, String formato, String parametros, byte[] contenido) {
        try {
            Reporte reporte = new Reporte();
            Usuario usuario = new Usuario();
            usuario.setId(SecurityUtils.getCurrentUserId());
            reporte.setUsuario(usuario);
            reporte.setTipo(tipo);
            reporte.setFormato(formato.toLowerCase());
            reporte.setParametros(parametros);

            String extension = "pdf".equalsIgnoreCase(formato) ? "pdf" : "xlsx";
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = tipo.toLowerCase() + "_" + timestamp + "." + extension;
            Path dirPath = Paths.get(reportesDir);
            Files.createDirectories(dirPath);

            Path filePath = dirPath.resolve(filename);
            Files.write(filePath, contenido);
            reporte.setRutaArchivo(filePath.toString());

            reporteRepository.save(reporte);
        } catch (Exception e) {
            entityManager.clear();
            System.err.println("Error registrando reporte (no bloquea descarga): " + e.getMessage());
        }
    }

    private byte[] generarInventarioExcel(List<Producto> productos) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Inventario");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("SKU");
            header.createCell(1).setCellValue("Producto");
            header.createCell(2).setCellValue("Categoria");
            header.createCell(3).setCellValue("Proveedor");
            header.createCell(4).setCellValue("Stock");
            header.createCell(5).setCellValue("Precio Venta");
            header.createCell(6).setCellValue("Punto Pedido");

            int rowIdx = 1;
            for (Producto p : productos) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getSku());
                row.createCell(1).setCellValue(p.getNombre());
                row.createCell(2).setCellValue(p.getCategoria() != null ? p.getCategoria().getNombre() : "");
                row.createCell(3).setCellValue(p.getProveedor() != null ? p.getProveedor().getNombre() : "");
                row.createCell(4).setCellValue(p.getStockActual());
                row.createCell(5).setCellValue(p.getPrecioVenta() != null ? p.getPrecioVenta().doubleValue() : 0);
                row.createCell(6).setCellValue(p.getPuntoPedido());
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte Excel: " + e.getMessage());
        }
    }

    private byte[] generarInventarioPDF(List<Producto> productos) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            PDPageContentStream cs = new PDPageContentStream(document, page);
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
            cs.newLineAtOffset(50, 750);
            cs.showText("REPORTE DE INVENTARIO - Metroica");
            cs.endText();

            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            cs.newLineAtOffset(50, 720);

            int y = 700;
            for (Producto p : productos) {
                if (y < 50) {
                    cs.endText();
                    cs.close();
                    page = new PDPage();
                    document.addPage(page);
                    cs = new PDPageContentStream(document, page);
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                    cs.newLineAtOffset(50, 750);
                    y = 730;
                }
                String linea = String.format("%s | %s | Stock: %d | Precio: $%.2f",
                        p.getSku(), p.getNombre(), p.getStockActual(),
                        p.getPrecioVenta() != null ? p.getPrecioVenta() : 0);
                cs.newLineAtOffset(0, -15);
                cs.showText(linea);
                y -= 15;
            }
            cs.endText();
            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte PDF: " + e.getMessage());
        }
    }

    private byte[] generarPedidosExcel(List<Pedido> pedidos) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Pedidos");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Numero");
            header.createCell(1).setCellValue("Canal");
            header.createCell(2).setCellValue("Estado");
            header.createCell(3).setCellValue("Cliente");
            header.createCell(4).setCellValue("Total");
            header.createCell(5).setCellValue("Fecha");

            int rowIdx = 1;
            for (Pedido pedido : pedidos) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(pedido.getNumero());
                row.createCell(1).setCellValue(pedido.getCanal().name());
                row.createCell(2).setCellValue(pedido.getEstado().name());
                row.createCell(3).setCellValue(pedido.getClienteNombre());
                row.createCell(4).setCellValue(pedido.getTotal() != null ? pedido.getTotal().doubleValue() : 0);
                row.createCell(5).setCellValue(pedido.getFechaIngreso() != null ?
                        pedido.getFechaIngreso().format(DateTimeFormatter.ISO_DATE) : "");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte Excel: " + e.getMessage());
        }
    }

    private byte[] generarPedidosPDF(List<Pedido> pedidos) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            PDPageContentStream cs = new PDPageContentStream(document, page);
            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
            cs.newLineAtOffset(50, 750);
            cs.showText("REPORTE DE PEDIDOS - Metroica");
            cs.endText();

            cs.beginText();
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            cs.newLineAtOffset(50, 720);

            int y = 700;
            for (Pedido pedido : pedidos) {
                if (y < 50) {
                    cs.endText();
                    cs.close();
                    page = new PDPage();
                    document.addPage(page);
                    cs = new PDPageContentStream(document, page);
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                    cs.newLineAtOffset(50, 750);
                    y = 730;
                }
                String linea = String.format("#%d | %s | %s | Total: $%.2f | %s",
                        pedido.getNumero(), pedido.getCanal(), pedido.getClienteNombre(),
                        pedido.getTotal() != null ? pedido.getTotal() : 0,
                        pedido.getFechaIngreso() != null ?
                                pedido.getFechaIngreso().format(DateTimeFormatter.ISO_DATE) : "");
                cs.newLineAtOffset(0, -15);
                cs.showText(linea);
                y -= 15;
            }
            cs.endText();
            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar reporte PDF: " + e.getMessage());
        }
    }
}
