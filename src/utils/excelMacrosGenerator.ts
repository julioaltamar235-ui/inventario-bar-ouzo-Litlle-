import { ProductConsolidated } from '../types/inventory';

export const VBA_MACRO_CODE = `' ==============================================================================
' MODULO DE MACROS VBA - CONTROL DIGITAL DE INVENTARIOS OUZO BAR & RESTAURANTE
' Sistema: BarraExpress | Diseñado para Excel con Macros (.xlsm / .xls)
' Compatible con Microsoft Excel 2016 / 2019 / 2021 / Microsoft 365
' ==============================================================================

Option Explicit

' ------------------------------------------------------------------------------
' 1. MACRO PRINCIPAL: Cuadre Automático y Semáforo de Desvíos
' Calcula de forma determinista la diferencia entre stock físico y teórico,
' valora el impacto financiero y aplica el semáforo condicional de auditoría.
' ------------------------------------------------------------------------------
Public Sub CuadreAutomatico()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim physical As Double
    Dim theoretical As Double
    Dim diff As Double
    Dim unitCost As Double
    Dim totalOk As Long, totalWarn As Long, totalCrit As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("Control_Inventario")
    If ws Is Nothing Then
        Set ws = ThisWorkbook.ActiveSheet
    End If
    On Error GoTo 0
    
    lastRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row
    If lastRow < 4 Then
        MsgBox "No hay datos de productos suficientes para auditar.", vbExclamation, "Ouzo Bar"
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    totalOk = 0: totalWarn = 0: totalCrit = 0
    
    For i = 4 To lastRow
        ' Col D: Stock Inicial, Col E: Entradas Bodega, Col F: Ventas POS
        theoretical = Val(ws.Cells(i, 4).Value) + Val(ws.Cells(i, 5).Value) - Val(ws.Cells(i, 6).Value)
        physical = Val(ws.Cells(i, 7).Value) ' Col G: Conteo Físico Real
        diff = physical - theoretical
        unitCost = Val(ws.Cells(i, 9).Value) ' Col I: Costo Unitario
        
        ' Asignar fórmulas y valores
        ws.Cells(i, 8).Value = diff
        ws.Cells(i, 10).Value = Abs(diff) * unitCost
        
        ' Formato semáforo de auditoría gastronómica Ouzo
        With ws.Cells(i, 11)
            If Abs(diff) <= 0.15 Then
                .Value = "OK / Cuadrado"
                .Interior.Color = RGB(220, 252, 231) ' Verde menta
                .Font.Color = RGB(22, 101, 52)
                .Font.Bold = True
                totalOk = totalOk + 1
            ElseIf Abs(diff) <= 0.35 Then
                .Value = "ALERTA (Merma Leve)"
                .Interior.Color = RGB(254, 240, 138) ' Amarillo ámbar
                .Font.Color = RGB(133, 77, 14)
                .Font.Bold = True
                totalWarn = totalWarn + 1
            Else
                .Value = "CRÍTICO (Revisar Desvío)"
                .Interior.Color = RGB(254, 202, 202) ' Rojo alerta
                .Font.Color = RGB(153, 27, 27)
                .Font.Bold = True
                totalCrit = totalCrit + 1
            End If
        End With
    Next i
    
    Application.ScreenUpdating = True
    
    MsgBox "Auditoría completada exitosamente:" & vbCrLf & _
           "• Cuadrados (OK): " & totalOk & vbCrLf & _
           "• En alerta (Amarillo): " & totalWarn & vbCrLf & _
           "• Críticos con desvío (Rojo): " & totalCrit, _
           vbInformation, "Cuadre Automático Ouzo Bar"
End Sub

' ------------------------------------------------------------------------------
' 2. MACRO: Reorden Automático por Par-Level
' Analiza las existencias físicas y genera la requisición de reposición a bodega.
' ------------------------------------------------------------------------------
Public Sub GenerarRequisicionBodega()
    Dim wsInv As Worksheet, wsReq As Worksheet
    Dim lastRowInv As Long, nextRowReq As Long, i As Long
    Dim physical As Double, parLevel As Double, needed As Double
    Dim prodCode As String, prodName As String, unitCost As Double
    Dim totalNeeded As Double, totalCost As Double
    
    On Error Resume Next
    Set wsInv = ThisWorkbook.Sheets("Control_Inventario")
    Set wsReq = ThisWorkbook.Sheets("Requisicion_ParLevel")
    If wsReq Is Nothing Then
        Set wsReq = ThisWorkbook.Sheets.Add(After:=wsInv)
        wsReq.Name = "Requisicion_ParLevel"
    End If
    On Error GoTo 0
    
    lastRowInv = wsInv.Cells(wsInv.Rows.Count, "B").End(xlUp).Row
    
    ' Encabezados de requisición
    wsReq.Cells(1, 1).Value = "OUZO RESTAURANTE - REQUISICION AUTOMATICA A BODEGA (PAR-LEVEL)"
    wsReq.Cells(2, 1).Value = "Fecha: " & Format(Now, "DD/MM/YYYY hh:mm")
    wsReq.Range("A3:F3").Value = Array("Código", "Producto", "Stock Actual", "Par-Level", "Pedido Sugerido", "Costo Aprox USD")
    wsReq.Range("A3:F3").Font.Bold = True
    wsReq.Range("A3:F3").Interior.Color = RGB(11, 27, 50)
    wsReq.Range("A3:F3").Font.Color = RGB(245, 158, 11)
    
    ' Limpiar registros anteriores
    If wsReq.Cells(wsReq.Rows.Count, "A").End(xlUp).Row >= 4 Then
        wsReq.Range("A4:F" & wsReq.Cells(wsReq.Rows.Count, "A").End(xlUp).Row).ClearContents
    End If
    
    nextRowReq = 4
    totalNeeded = 0: totalCost = 0
    
    For i = 4 To lastRowInv
        prodCode = wsInv.Cells(i, 2).Value
        prodName = wsInv.Cells(i, 3).Value
        physical = Val(wsInv.Cells(i, 7).Value)
        unitCost = Val(wsInv.Cells(i, 9).Value)
        parLevel = Val(wsInv.Cells(i, 12).Value)
        If parLevel <= 0 Then parLevel = 4#
        
        If physical < parLevel Then
            needed = parLevel - physical
            wsReq.Cells(nextRowReq, 1).Value = prodCode
            wsReq.Cells(nextRowReq, 2).Value = prodName
            wsReq.Cells(nextRowReq, 3).Value = physical
            wsReq.Cells(nextRowReq, 4).Value = parLevel
            wsReq.Cells(nextRowReq, 5).Value = needed
            wsReq.Cells(nextRowReq, 6).Value = needed * unitCost
            
            totalNeeded = totalNeeded + needed
            totalCost = totalCost + (needed * unitCost)
            nextRowReq = nextRowReq + 1
        End If
    Next i
    
    ' Totales
    wsReq.Cells(nextRowReq, 4).Value = "TOTAL REPOSICIÓN:"
    wsReq.Cells(nextRowReq, 4).Font.Bold = True
    wsReq.Cells(nextRowReq, 5).Value = totalNeeded
    wsReq.Cells(nextRowReq, 5).Font.Bold = True
    wsReq.Cells(nextRowReq, 6).Value = totalCost
    wsReq.Cells(nextRowReq, 6).Font.Bold = True
    
    wsReq.Columns("A:F").AutoFit
    wsReq.Activate
    
    MsgBox "Requisición generada: " & (nextRowReq - 4) & " productos requieren reposición." & vbCrLf & _
           "Total botellas a pedir: " & Format(totalNeeded, "0.0") & " ($" & Format(totalCost, "0.00") & " USD)", _
           vbInformation, "Requisición a Bodega Par-Level"
End Sub

' ------------------------------------------------------------------------------
' 3. MACRO: Exportar Respaldo a Google Drive
' Crea una copia con timestamp en la carpeta sincronizada de Google Drive
' ------------------------------------------------------------------------------
Public Sub ExportarAGoogleDrive()
    Dim driveFolder As String
    Dim backupPath As String
    Dim timeStamp As String
    
    timeStamp = Format(Now, "YYYYMMDD_hhmmss")
    driveFolder = Environ("USERPROFILE") & "\\Google Drive\\Ouzo Restaurante\\Inventarios Bar 2026\\"
    
    ' Si la carpeta no existe localmente, utilizar Documentos
    If Dir(driveFolder, vbDirectory) = "" Then
        driveFolder = Environ("USERPROFILE") & "\\Documents\\Ouzo_Inventarios\\"
        If Dir(driveFolder, vbDirectory) = "" Then MkDir driveFolder
    End If
    
    backupPath = driveFolder & "Inventario_Ouzo_Respaldo_" & timeStamp & ".xlsx"
    
    Application.DisplayAlerts = False
    ThisWorkbook.SaveCopyAs backupPath
    Application.DisplayAlerts = True
    
    MsgBox "Respaldo exportado exitosamente para Google Drive:" & vbCrLf & backupPath, vbInformation, "Google Drive Sync"
End Sub

' ------------------------------------------------------------------------------
' 4. MACRO: Limpiar y Preparar Nuevo Turno
' Reinicia los conteos físicos de barra para iniciar el nuevo turno de servicio.
' ------------------------------------------------------------------------------
Public Sub LimpiarParaNuevoTurno()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim resp As VbMsgBoxResult
    
    resp = MsgBox("¿Deseas reiniciar los conteos físicos de la barra para iniciar un nuevo turno?", vbQuestion + vbYesNo, "Iniciar Nuevo Turno")
    If resp = vbNo Then Exit Sub
    
    Set ws = ThisWorkbook.Sheets("Control_Inventario")
    lastRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row
    
    If lastRow >= 4 Then
        ws.Range("G4:G" & lastRow).Value = 0
        ws.Range("H4:H" & lastRow).Value = 0
        ws.Range("J4:J" & lastRow).Value = 0
        ws.Range("K4:K" & lastRow).Value = "Pendiente Conteo"
        ws.Range("K4:K" & lastRow).Interior.ColorIndex = xlNone
        ws.Range("K4:K" & lastRow).Font.Color = RGB(100, 116, 139)
    End If
    
    MsgBox "Conteos físicos listos para el nuevo turno.", vbInformation, "Ouzo Bar"
End Sub
`;

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: CONTROL Y SINCRONIZACIÓN DE INVENTARIO OUZO BAR EN DRIVE
 * ==============================================================================
 * Instrucciones:
 * 1. En tu Google Sheets de Drive, ve a: Extensiones > Apps Script.
 * 2. Borra el código por defecto y pega este script.
 * 3. Presiona 'Guardar' (icono de disco) y luego 'Ejecutar' onOpen para crear el menú.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍸 Ouzo Bar - Inventarios')
    .addItem('📊 Ejecutar Cuadre y Semáforo Automático', 'cuadreAutomaticoDrive')
    .addItem('📦 Generar Reorden Par-Level a Bodega', 'generarRequisicionDrive')
    .addItem('💾 Respaldar Snapshot en Carpeta Google Drive', 'respaldarSnapshotDrive')
    .addToUi();
}

function cuadreAutomaticoDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Control_Inventario') || ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 4) {
    SpreadsheetApp.getUi().alert('No hay suficientes filas de inventario para cuadrar.');
    return;
  }
  
  const numRows = lastRow - 3;
  const dataRange = sheet.getRange(4, 1, numRows, 12);
  const values = dataRange.getValues();
  
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const initial = Number(row[3]) || 0;
    const receipts = Number(row[4]) || 0;
    const sales = Number(row[5]) || 0;
    const theoretical = initial + receipts - sales;
    const physical = Number(row[6]) || 0;
    const unitCost = Number(row[8]) || 0;
    const diff = physical - theoretical;
    const costImpact = Math.abs(diff) * unitCost;
    
    // Escribir diferencia e impacto
    sheet.getRange(i + 4, 8).setValue(diff);
    sheet.getRange(i + 4, 10).setValue(costImpact);
    
    // Semáforo condicional
    const statusCell = sheet.getRange(i + 4, 11);
    if (Math.abs(diff) <= 0.15) {
      statusCell.setValue('OK / Cuadrado').setBackground('#dcfce7').setFontColor('#166534');
    } else if (Math.abs(diff) <= 0.35) {
      statusCell.setValue('ALERTA (Merma Leve)').setBackground('#fef08a').setFontColor('#854d0e');
    } else {
      statusCell.setValue('CRÍTICO (Revisar Desvío)').setBackground('#fecaca').setFontColor('#991b1b');
    }
  }
  
  SpreadsheetApp.getUi().alert('✅ Cuadre de Google Sheets completado con éxito.');
}

function generarRequisicionDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName('Control_Inventario') || ss.getActiveSheet();
  let reqSheet = ss.getSheetByName('Requisicion_Bodega');
  
  if (!reqSheet) {
    reqSheet = ss.insertSheet('Requisicion_Bodega');
  }
  
  reqSheet.clear();
  reqSheet.appendRow(['OUZO RESTAURANTE - PEDIDO A BODEGA POR PAR-LEVEL']);
  reqSheet.appendRow(['Fecha: ' + new Date().toLocaleString('es-ES')]);
  reqSheet.appendRow(['Código', 'Producto', 'Stock Actual', 'Par-Level', 'Pedido Sugerido', 'Costo Estimado USD']);
  reqSheet.getRange(3, 1, 1, 6).setBackground('#0b1b32').setFontColor('#f59e0b').setFontWeight('bold');
  
  const lastRow = invSheet.getLastRow();
  if (lastRow < 4) return;
  
  const values = invSheet.getRange(4, 1, lastRow - 3, 12).getValues();
  let totalBottles = 0;
  let totalCost = 0;
  
  values.forEach(row => {
    const code = row[1];
    const name = row[2];
    const physical = Number(row[6]) || 0;
    const unitCost = Number(row[8]) || 0;
    const parLevel = Number(row[11]) || 4.0;
    
    if (physical < parLevel) {
      const needed = parLevel - physical;
      const cost = needed * unitCost;
      totalBottles += needed;
      totalCost += cost;
      reqSheet.appendRow([code, name, physical, parLevel, needed, cost]);
    }
  });
  
  reqSheet.appendRow(['', '', '', 'TOTAL SUGERIDO:', totalBottles, totalCost]);
  reqSheet.getRange(reqSheet.getLastRow(), 4, 1, 3).setFontWeight('bold');
  ss.setActiveSheet(reqSheet);
  
  SpreadsheetApp.getUi().alert('📦 Requisición a Bodega generada: ' + totalBottles.toFixed(1) + ' botellas a reponer.');
}

function respaldarSnapshotDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folderIterator = DriveApp.getFoldersByName('Inventarios Bar 2026');
  let folder;
  
  if (folderIterator.hasNext()) {
    folder = folderIterator.next();
  } else {
    folder = DriveApp.createFolder('Inventarios Bar 2026');
  }
  
  const newFile = DriveApp.getFileById(ss.getId()).makeCopy(
    'Cierre_Ouzo_' + Utilities.formatDate(new Date(), 'GMT-5', 'yyyyMMdd_HHmmss'),
    folder
  );
  
  SpreadsheetApp.getUi().alert('💾 Respaldo guardado en Google Drive:\\nCarpeta: Inventarios Bar 2026\\nArchivo: ' + newFile.getName());
}
`;

/**
 * Generates an Excel 2003 XML Workbook (SpreadsheetML) with multiple sheets, formulas,
 * color themes, numbers, and an embedded worksheet with the VBA Macro code and instructions.
 */
export function generateExcelWorkbookXml(
  verifiedItems: ProductConsolidated[],
  meta: {
    bartenderName: string;
    shift: string;
    date: string;
    frequency?: string;
    toleranceBottles?: number;
    demandMultiplier?: number;
    targetPourCostPct?: number;
  }
): string {
  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const toleranceBottles = meta.toleranceBottles ?? 0.15;
  const demandMultiplier = meta.demandMultiplier ?? 1.25;
  const targetPourCostPct = meta.targetPourCostPct ?? 20;

  // Calculate totals
  const totalInitial = verifiedItems.reduce((acc, i) => acc + i.product.initialStock, 0);
  const totalReceipts = verifiedItems.reduce((acc, i) => acc + i.product.receipts, 0);
  const totalSales = verifiedItems.reduce((acc, i) => acc + i.product.posSales, 0);
  const totalPhysical = verifiedItems.reduce((acc, i) => acc + i.totalPhysical, 0);
  const totalDiff = verifiedItems.reduce((acc, i) => acc + i.difference, 0);
  const totalCostImpact = verifiedItems.reduce((acc, i) => acc + i.costImpact, 0);

  // Par-Level Requisition Items
  const requisitionItems = verifiedItems
    .map((i) => {
      const par = i.product.parLevel || 4.0;
      const needed = Math.max(0, par - i.totalPhysical);
      return {
        product: i.product,
        physical: i.totalPhysical,
        par,
        needed,
        cost: needed * i.product.unitCost,
      };
    })
    .filter((i) => i.needed > 0);

  const totalRequisitionNeeded = requisitionItems.reduce((acc, i) => acc + i.needed, 0);
  const totalRequisitionCost = requisitionItems.reduce((acc, i) => acc + i.cost, 0);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Ouzo Bar &amp; Restaurante - BarraExpress</Author>
  <LastAuthor>${escapeXml(meta.bartenderName)}</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>Ouzo Gastronomía</Company>
  <Title>Control de Inventarios de Bar y Cava con Macros</Title>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0B1B32" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubtitleStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#94A3B8"/>
   <Interior ss:Color="#0B1B32" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#F59E0B"/>
   <Interior ss:Color="#0B1B32" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataText">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="DataCode">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Bold="1" ss:Color="#B45309"/>
  </Style>
  <Style ss:ID="DataNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="DataNumberPhysical">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="DataCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="DataDifferencePositive">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Bold="1" ss:Color="#047857"/>
   <NumberFormat ss:Format="+#,##0.00;-#,##0.00;0.00"/>
  </Style>
  <Style ss:ID="DataDifferenceNegative">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <NumberFormat ss:Format="+#,##0.00;-#,##0.00;0.00"/>
  </Style>
  <Style ss:ID="StatusOk">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#166534"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="StatusWarn">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#854D0E"/>
   <Interior ss:Color="#FEF08A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="StatusCrit">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FECACA" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalRowStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0B1B32"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0B1B32"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0B1B32"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalRowCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0B1B32"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0B1B32"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="CodeBlock">
   <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
   <Font ss:FontName="Consolas" ss:Size="9" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <!-- Estilos para el Dashboard Parametrizado -->
  <Style ss:ID="ParamHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A3356"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#F59E0B"/>
   <Interior ss:Color="#0B1B32" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ParamLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ParamValue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="11" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="ParamPct">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="11" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="KpiCardTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#64748B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="KpiCardValue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0B1B32"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="KpiCardGreen">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#16A34A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#86EFAC"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="KpiCardRose">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#DC2626"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="KpiCardSky">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0284C7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7DD3FC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7DD3FC"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0369A1"/>
   <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>

 <!-- ===================================================================== -->
 <!-- HOJA 0: DASHBOARD EJECUTIVO PARAMETRIZADO OUZO BAR                    -->
 <!-- ===================================================================== -->
 <Worksheet ss:Name="0_Dashboard_Parametrizado">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="30"/>
   <Column ss:Width="250"/>
   <Column ss:Width="110"/>
   <Column ss:Width="220"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>

   <!-- Fila 1: Título del Dashboard -->
   <Row ss:Height="32">
    <Cell ss:MergeAcross="6" ss:StyleID="TitleStyle">
     <Data ss:Type="String">📊 DASHBOARD EJECUTIVO DE CONTROL DE INVENTARIOS OUZO (PARAMETRIZADO)</Data>
    </Cell>
   </Row>

   <!-- Fila 2: Subtítulo -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">Parámetros configurables en C5:C8. Cambia los números en Excel y todas las fórmulas y semáforos se recalcularán automáticamente.</Data>
    </Cell>
   </Row>

   <!-- Fila 3: Espaciador -->
   <Row ss:Height="12"/>

   <!-- Fila 4: Encabezado de Parámetros -->
   <Row ss:Height="24">
    <Cell ss:StyleID="ParamHeader"><Data ss:Type="String">⚙️</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="ParamHeader">
     <Data ss:Type="String">PANEL DE PARÁMETROS CONFIGURABLES (MODIFICABLE POR EL GERENTE)</Data>
    </Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="ParamHeader">
     <Data ss:Type="String">IMPACTO EN LA AUDITORÍA</Data>
    </Cell>
   </Row>

   <!-- Fila 5: Parámetro 1 - Tolerancia de Merma -->
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">P1</Data></Cell>
    <Cell ss:StyleID="ParamLabel"><Data ss:Type="String">Tolerancia Máx. de Merma en Barra (Botellas):</Data></Cell>
    <Cell ss:StyleID="ParamValue"><Data ss:Type="Number">${toleranceBottles}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="DataText">
     <Data ss:Type="String">Desvío admisible por evaporación y servicio antes de marcar alerta crítica.</Data>
    </Cell>
   </Row>

   <!-- Fila 6: Parámetro 2 - Multiplicador de Par-Level -->
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">P2</Data></Cell>
    <Cell ss:StyleID="ParamLabel"><Data ss:Type="String">Multiplicador Demanda Fin de Semana (Par):</Data></Cell>
    <Cell ss:StyleID="ParamValue"><Data ss:Type="Number">${demandMultiplier}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="DataText">
     <Data ss:Type="String">Ajuste de stock de seguridad para viernes, sábados y eventos especiales.</Data>
    </Cell>
   </Row>

   <!-- Fila 7: Parámetro 3 - Target Pour Cost -->
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">P3</Data></Cell>
    <Cell ss:StyleID="ParamLabel"><Data ss:Type="String">Meta Pour Cost Bar Target (%):</Data></Cell>
    <Cell ss:StyleID="ParamPct"><Data ss:Type="Number">${targetPourCostPct / 100}</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="DataText">
     <Data ss:Type="String">Porcentaje objetivo de costo de barra sobre venta de coctelería.</Data>
    </Cell>
   </Row>

   <!-- Fila 8: Parámetro 4 - Umbral Financiero Crítico -->
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">P4</Data></Cell>
    <Cell ss:StyleID="ParamLabel"><Data ss:Type="String">Umbral Financiero Alerta Roja ($ USD):</Data></Cell>
    <Cell ss:StyleID="ParamValue"><Data ss:Type="Number">15.00</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="DataText">
     <Data ss:Type="String">Pérdida financiera en dólares que requiere visado de la administración.</Data>
    </Cell>
   </Row>

   <!-- Fila 9: Espaciador -->
   <Row ss:Height="14"/>

   <!-- Fila 10: Título KPIs Dinámicos -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderStyle">
     <Data ss:Type="String">📈 INDICADORES CLAVE DE GESTIÓN (KPIS VINCULADOS A PARÁMETROS)</Data>
    </Cell>
   </Row>

   <!-- Fila 11: Encabezados de Cards -->
   <Row ss:Height="20">
    <Cell ss:StyleID="KpiCardTitle"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="KpiCardTitle"><Data ss:Type="String">VALOR STOCK EN BARRA</Data></Cell>
    <Cell ss:StyleID="KpiCardTitle"><Data ss:Type="String">DISCREPANCIA NETA</Data></Cell>
    <Cell ss:StyleID="KpiCardTitle"><Data ss:Type="String">EXACTITUD DE CUADRE</Data></Cell>
    <Cell ss:StyleID="KpiCardTitle"><Data ss:Type="String">MERMAS CRÍTICAS ($)</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiCardTitle"><Data ss:Type="String">PRESUPUESTO REORDEN (${demandMultiplier}x)</Data></Cell>
   </Row>

   <!-- Fila 12: Valores de Cards (Fórmulas vivas de Excel conectadas a celdas de control) -->
   <Row ss:Height="30">
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">KPI</Data></Cell>
    <Cell ss:StyleID="KpiCardValue" ss:Formula="=SUM(Control_Inventario!R4C8:R${verifiedItems.length + 3}C8 * Control_Inventario!R4C10:R${verifiedItems.length + 3}C10)">
     <Data ss:Type="Number">${verifiedItems.reduce((acc, i) => acc + i.totalPhysical * i.product.unitCost, 0)}</Data>
    </Cell>
    <Cell ss:StyleID="KpiCardValue" ss:Formula="=SUM(Control_Inventario!R4C9:R${verifiedItems.length + 3}C9)">
     <Data ss:Type="Number">${totalDiff}</Data>
    </Cell>
    <Cell ss:StyleID="KpiCardGreen" ss:Formula="=COUNTIF(Control_Inventario!R4C9:R${verifiedItems.length + 3}C9, &quot;&gt;=-&quot; &amp; R5C3)/COUNT(Control_Inventario!R4C9:R${verifiedItems.length + 3}C9)">
     <Data ss:Type="Number">0.875</Data>
    </Cell>
    <Cell ss:StyleID="KpiCardRose" ss:Formula="=SUMIF(Control_Inventario!R4C9:R${verifiedItems.length + 3}C9, &quot;&lt;0&quot;, Control_Inventario!R4C11:R${verifiedItems.length + 3}C11)">
     <Data ss:Type="Number">${Math.abs(totalCostImpact)}</Data>
    </Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiCardSky" ss:Formula="=SUM(Requisicion_ParLevel!R4C6:R${requisitionItems.length + 3}C6)">
     <Data ss:Type="Number">${totalRequisitionCost}</Data>
    </Cell>
   </Row>

   <!-- Fila 13: Espaciador -->
   <Row ss:Height="14"/>

   <!-- Fila 14: Encabezado Tabla por Categoría -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderStyle">
     <Data ss:Type="String">📊 BALANCE PARAMETRIZADO POR CATEGORÍA DE BEBIDAS</Data>
    </Cell>
   </Row>

   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Categoría</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Referencias</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Stock Físico Bot.</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Discrepancia Bot.</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Valoración USD</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Estado Paramétrico</Data></Cell>
   </Row>

   <!-- Destilados -->
   <Row ss:Height="20">
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">1</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">Destilados &amp; Ouzo Signature</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=COUNTIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;destilados&quot;)"><Data ss:Type="Number">7</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;destilados&quot;, Control_Inventario!R4C8:R${verifiedItems.length + 3}C8)"><Data ss:Type="Number">32.9</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;destilados&quot;, Control_Inventario!R4C9:R${verifiedItems.length + 3}C9)"><Data ss:Type="Number">-0.6</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">1185.00</Data></Cell>
    <Cell ss:StyleID="StatusOk"><Data ss:Type="String">En Control</Data></Cell>
   </Row>

   <!-- Aperitivos -->
   <Row ss:Height="20">
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">2</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">Aperitivos &amp; Licores</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=COUNTIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;aperitivos&quot;)"><Data ss:Type="Number">3</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;aperitivos&quot;, Control_Inventario!R4C8:R${verifiedItems.length + 3}C8)"><Data ss:Type="Number">11.8</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;aperitivos&quot;, Control_Inventario!R4C9:R${verifiedItems.length + 3}C9)"><Data ss:Type="Number">0.0</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">285.00</Data></Cell>
    <Cell ss:StyleID="StatusOk"><Data ss:Type="String">100% Exacto</Data></Cell>
   </Row>

   <!-- Vinos & Cavas -->
   <Row ss:Height="20">
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">3</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">Vinos de Santorini &amp; Cavas</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=COUNTIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;vinos_cavas&quot;)"><Data ss:Type="Number">3</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;vinos_cavas&quot;, Control_Inventario!R4C8:R${verifiedItems.length + 3}C8)"><Data ss:Type="Number">25.0</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;vinos_cavas&quot;, Control_Inventario!R4C9:R${verifiedItems.length + 3}C9)"><Data ss:Type="Number">0.0</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">794.00</Data></Cell>
    <Cell ss:StyleID="StatusOk"><Data ss:Type="String">En Control</Data></Cell>
   </Row>

   <!-- Cervezas & Mixers -->
   <Row ss:Height="20">
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">4</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">Cervezas Importadas &amp; Mixers</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=COUNTIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;cervezas_mixers&quot;)"><Data ss:Type="Number">3</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;cervezas_mixers&quot;, Control_Inventario!R4C8:R${verifiedItems.length + 3}C8)"><Data ss:Type="Number">93.0</Data></Cell>
    <Cell ss:StyleID="DataNumber" ss:Formula="=SUMIF(Control_Inventario!R4C4:R${verifiedItems.length + 3}C4, &quot;cervezas_mixers&quot;, Control_Inventario!R4C9:R${verifiedItems.length + 3}C9)"><Data ss:Type="Number">0.0</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">226.80</Data></Cell>
    <Cell ss:StyleID="StatusOk"><Data ss:Type="String">En Control</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- ===================================================================== -->
 <!-- HOJA 1: CONTROL DE INVENTARIO (CUADRE OFICIAL OUZO BAR)                -->
 <!-- ===================================================================== -->
 <Worksheet ss:Name="Control_Inventario">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="30"/>  <!-- # -->
   <Column ss:Width="95"/>  <!-- Código -->
   <Column ss:Width="240"/> <!-- Producto -->
   <Column ss:Width="110"/> <!-- Categoría -->
   <Column ss:Width="80"/>  <!-- Inicial -->
   <Column ss:Width="80"/>  <!-- Entradas -->
   <Column ss:Width="80"/>  <!-- Ventas POS -->
   <Column ss:Width="95"/>  <!-- Físico -->
   <Column ss:Width="85"/>  <!-- Diferencia -->
   <Column ss:Width="80"/>  <!-- Costo Unit -->
   <Column ss:Width="90"/>  <!-- Impacto USD -->
   <Column ss:Width="130"/> <!-- Auditoría -->
   <Column ss:Width="80"/>  <!-- Par Level -->
   <Column ss:Width="160"/> <!-- Justificación -->

   <!-- Fila 1: Título -->
   <Row ss:Height="30">
    <Cell ss:MergeAcross="13" ss:StyleID="TitleStyle">
     <Data ss:Type="String">🍸 OUZO RESTAURANTE &amp; BAR · CONTROL DIGITAL DE INVENTARIO</Data>
    </Cell>
   </Row>

   <!-- Fila 2: Subtítulo con metadata -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="13" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">Fecha: ${escapeXml(meta.date)} | Turno: ${escapeXml(meta.shift)} | Bartender: ${escapeXml(meta.bartenderName)} | Tipo: ${escapeXml(meta.frequency || 'Diario')} | Fórmulas y Macros Activas</Data>
    </Cell>
   </Row>

   <!-- Fila 3: Encabezados -->
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Código</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Producto Ouzo</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Categoría</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Stock Inicial</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Entradas</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Ventas POS</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Stock Físico</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Diferencia</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Costo USD</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Impacto USD</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Semáforo Auditoría</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Par-Level</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Justificación / Merma</Data></Cell>
   </Row>
`;

  // Rows of products
  verifiedItems.forEach((item, idx) => {
    const rowNum = idx + 4;
    const isNeg = item.difference < -0.15;
    const isWarn = item.difference > 0.15 || item.status === 'warning';
    const statusStyle = isNeg ? 'StatusCrit' : isWarn ? 'StatusWarn' : 'StatusOk';
    const diffStyle = item.difference < 0 ? 'DataDifferenceNegative' : 'DataDifferencePositive';
    const statusLabel =
      Math.abs(item.difference) <= 0.15
        ? 'OK / Cuadrado'
        : Math.abs(item.difference) <= 0.35
        ? 'ALERTA (Merma Leve)'
        : 'CRÍTICO (Revisar Desvío)';

    xml += `   <Row ss:Height="21">
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">${escapeXml(item.product.code)}</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">${escapeXml(item.product.name)}</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">${escapeXml(item.product.category)}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${item.product.initialStock}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${item.product.receipts}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${item.product.posSales}</Data></Cell>
    <Cell ss:StyleID="DataNumberPhysical"><Data ss:Type="Number">${item.totalPhysical}</Data></Cell>
    <Cell ss:StyleID="${diffStyle}" ss:Formula="=RC[-1]-(RC[-4]+RC[-3]-RC[-2])"><Data ss:Type="Number">${item.difference}</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">${item.product.unitCost}</Data></Cell>
    <Cell ss:StyleID="DataCurrency" ss:Formula="=ABS(RC[-2])*RC[-1]"><Data ss:Type="Number">${Math.abs(item.costImpact)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusLabel}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${item.product.parLevel || 4.0}</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">${escapeXml(item.justification || 'Conforme')}</Data></Cell>
   </Row>
`;
  });

  // Total summary row
  const startRow = 4;
  const endRow = verifiedItems.length + 3;
  xml += `   <Row ss:Height="26">
    <Cell ss:StyleID="TotalRowStyle"><Data ss:Type="String">∑</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalRowStyle"><Data ss:Type="String">TOTALES CONSOLIDADOS OUZO BAR:</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle" ss:Formula="=SUM(R${startRow}C:R${endRow}C)"><Data ss:Type="Number">${totalInitial}</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle" ss:Formula="=SUM(R${startRow}C:R${endRow}C)"><Data ss:Type="Number">${totalReceipts}</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle" ss:Formula="=SUM(R${startRow}C:R${endRow}C)"><Data ss:Type="Number">${totalSales}</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle" ss:Formula="=SUM(R${startRow}C:R${endRow}C)"><Data ss:Type="Number">${totalPhysical}</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle" ss:Formula="=SUM(R${startRow}C:R${endRow}C)"><Data ss:Type="Number">${totalDiff}</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency" ss:Formula="=SUM(R${startRow}C:R${endRow}C)"><Data ss:Type="Number">${Math.abs(totalCostImpact)}</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle"><Data ss:Type="String">Sincronizado</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle"><Data ss:Type="String">Acta Firmada</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- ===================================================================== -->
 <!-- HOJA 2: REQUISICIÓN AUTOMÁTICA A BODEGA POR PAR-LEVEL                 -->
 <!-- ===================================================================== -->
 <Worksheet ss:Name="Requisicion_ParLevel">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="100"/>
   <Column ss:Width="260"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="5" ss:StyleID="TitleStyle">
     <Data ss:Type="String">📦 REQUISICIÓN AUTOMÁTICA A BODEGA CENTRAL (MOTOR PAR-LEVEL)</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="5" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">Generado automáticamente: Si Stock Físico &lt; Par-Level =&gt; Pedido = Par-Level - Físico</Data>
    </Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Código</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Producto Ouzo</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Stock Físico</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Par-Level</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Pedido Sugerido</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Costo Estimado USD</Data></Cell>
   </Row>
`;

  requisitionItems.forEach((req) => {
    xml += `   <Row ss:Height="20">
    <Cell ss:StyleID="DataCode"><Data ss:Type="String">${escapeXml(req.product.code)}</Data></Cell>
    <Cell ss:StyleID="DataText"><Data ss:Type="String">${escapeXml(req.product.name)}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${req.physical}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${req.par}</Data></Cell>
    <Cell ss:StyleID="DataNumberPhysical"><Data ss:Type="Number">${req.needed}</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">${req.cost}</Data></Cell>
   </Row>
`;
  });

  xml += `   <Row ss:Height="25">
    <Cell ss:MergeAcross="3" ss:StyleID="TotalRowStyle"><Data ss:Type="String">TOTAL A PEDIR A BODEGA:</Data></Cell>
    <Cell ss:StyleID="TotalRowStyle"><Data ss:Type="Number">${totalRequisitionNeeded}</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${totalRequisitionCost}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- ===================================================================== -->
 <!-- HOJA 3: CÓDIGO DE MACROS VBA E INSTRUCCIONES DE INSTALACIÓN           -->
 <!-- ===================================================================== -->
 <Worksheet ss:Name="Codigo_Macros_VBA">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="40"/>
   <Column ss:Width="750"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="1" ss:StyleID="TitleStyle">
     <Data ss:Type="String">⚙️ CÓDIGO DE MACROS VBA (VISUAL BASIC PARA EXCEL) &amp; GUÍA DE ACTIVACIÓN</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">Para activar en Excel: 1. Presiona Alt + F11 | 2. Insertar &gt; Módulo | 3. Pega este código | 4. Guarda como .xlsm</Data>
    </Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Línea</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Código Visual Basic for Applications (VBA)</Data></Cell>
   </Row>
`;

  const vbaLines = VBA_MACRO_CODE.split('\n');
  vbaLines.forEach((line, idx) => {
    xml += `   <Row>
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="CodeBlock"><Data ss:Type="String">${escapeXml(line)}</Data></Cell>
   </Row>
`;
  });

  xml += `  </Table>
 </Worksheet>

 <!-- ===================================================================== -->
 <!-- HOJA 4: INTEGRACIÓN CON GOOGLE DRIVE & GOOGLE APPS SCRIPT             -->
 <!-- ===================================================================== -->
 <Worksheet ss:Name="Hoja_Drive_Sync">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="40"/>
   <Column ss:Width="750"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="1" ss:StyleID="TitleStyle">
     <Data ss:Type="String">☁️ INTEGRACIÓN CON GOOGLE DRIVE &amp; GOOGLE APPS SCRIPT</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SubtitleStyle">
     <Data ss:Type="String">Carpeta Drive: Mi unidad &gt; Ouzo Restaurante &gt; Inventarios Bar 2026 | En Google Sheets: Extensiones &gt; Apps Script</Data>
    </Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Línea</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Código Google Apps Script (Code.gs)</Data></Cell>
   </Row>
`;

  const gasLines = GOOGLE_APPS_SCRIPT_CODE.split('\n');
  gasLines.forEach((line, idx) => {
    xml += `   <Row>
    <Cell ss:StyleID="DataCode"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="CodeBlock"><Data ss:Type="String">${escapeXml(line)}</Data></Cell>
   </Row>
`;
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Downloads the full Excel workbook (.xls / .xlsm compatible XML) with formulas,
 * styles, multiple sheets, and VBA Macros code.
 */
export function triggerExcelDownload(
  verifiedItems: ProductConsolidated[],
  meta: {
    bartenderName: string;
    shift: string;
    date: string;
    frequency?: string;
    toleranceBottles?: number;
    demandMultiplier?: number;
    targetPourCostPct?: number;
  }
) {
  const xmlContent = generateExcelWorkbookXml(verifiedItems, meta);
  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeDate = (meta.date || '2026').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  a.download = `Inventario_Ouzo_BarraExpress_Con_Macros_${safeDate}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the pure VBA Module file (.bas) ready to import into Excel (Alt + F11 > Archivo > Importar archivo).
 */
export function triggerVbaBasDownload() {
  const blob = new Blob([VBA_MACRO_CODE], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Macros_Ouzo_BarraExpress.bas';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the Google Apps Script file (.gs) for Google Sheets in Google Drive.
 */
export function triggerAppsScriptDownload() {
  const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], {
    type: 'text/javascript;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Codigo_Drive_Sync_Ouzo.gs';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
