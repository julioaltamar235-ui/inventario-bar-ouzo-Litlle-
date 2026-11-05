import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, thinkingMode } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'No se detectó GEMINI_API_KEY en las variables de entorno. Configure la clave en Settings > Secrets.',
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Lista de mensajes vacía o inválida.' });
    }

    const systemInstruction = `Eres el "Asistente Experto en Control de Inventarios de Barra y Restaurante" de BarraExpress.
Tu misión es asesorar al equipo gastronómico (Bartender, Administrador, Gerente de Alimentos y Bebidas) en:
1. Rediseño y optimización de conteos de inventarios (reducir las 22 horas mensuales a menos de 5 horas).
2. Técnicas rápidas de captura visual de botellas (décimos de botella, peso por gramaje, velocidad de speed rail).
3. Auditoría de mermas, variaciones y cotejo contra ventas teóricas del punto de venta (POS).
4. Mejores prácticas operativas para que el personal no descuide el servicio al cliente ni las propinas.
5. Apoyo en la Ficha Funcional y preparación del Prompt Maestro 2.

Responde de manera profesional, concisa, práctica y orientada a la operación real de un restaurante/bar. Usa español claro.`;

    const modelName = thinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash';

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const config: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    if (thinkingMode) {
      config.thinkingConfig = {
        thinkingLevel: 'HIGH',
      };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config,
    });

    const replyText = response.text || 'Sin respuesta generada.';
    res.json({ reply: replyText, model: modelName });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      error: error?.message || 'Error al procesar la solicitud con Gemini.',
    });
  }
});

// Endpoint to download pure VBA Module (.bas)
app.get('/api/download/vba-macros', (req, res) => {
  const vbaCode = `' ==============================================================================
' MODULO DE MACROS VBA - CONTROL DIGITAL DE INVENTARIOS OUZO BAR & RESTAURANTE
' Sistema: BarraExpress | Diseñado para Excel con Macros (.xlsm / .xls)
' Compatible con Microsoft Excel 2016 / 2019 / 2021 / Microsoft 365
' ==============================================================================

Option Explicit

Public Sub CuadreAutomatico()
    Dim ws As Worksheet, lastRow As Long, i As Long
    Dim physical As Double, theoretical As Double, diff As Double, unitCost As Double
    Dim totalOk As Long, totalWarn As Long, totalCrit As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("Control_Inventario")
    If ws Is Nothing Then Set ws = ThisWorkbook.ActiveSheet
    On Error GoTo 0
    
    lastRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row
    If lastRow < 4 Then Exit Sub
    
    Application.ScreenUpdating = False
    totalOk = 0: totalWarn = 0: totalCrit = 0
    
    For i = 4 To lastRow
        theoretical = Val(ws.Cells(i, 4).Value) + Val(ws.Cells(i, 5).Value) - Val(ws.Cells(i, 6).Value)
        physical = Val(ws.Cells(i, 7).Value)
        diff = physical - theoretical
        unitCost = Val(ws.Cells(i, 9).Value)
        
        ws.Cells(i, 8).Value = diff
        ws.Cells(i, 10).Value = Abs(diff) * unitCost
        
        With ws.Cells(i, 11)
            If Abs(diff) <= 0.15 Then
                .Value = "OK / Cuadrado"
                .Interior.Color = RGB(220, 252, 231)
                .Font.Color = RGB(22, 101, 52)
                .Font.Bold = True
                totalOk = totalOk + 1
            ElseIf Abs(diff) <= 0.35 Then
                .Value = "ALERTA (Merma Leve)"
                .Interior.Color = RGB(254, 240, 138)
                .Font.Color = RGB(133, 77, 14)
                .Font.Bold = True
                totalWarn = totalWarn + 1
            Else
                .Value = "CRÍTICO (Revisar Desvío)"
                .Interior.Color = RGB(254, 202, 202)
                .Font.Color = RGB(153, 27, 27)
                .Font.Bold = True
                totalCrit = totalCrit + 1
            End If
        End With
    Next i
    
    Application.ScreenUpdating = True
    MsgBox "Cuadre completado: " & totalOk & " OK, " & totalWarn & " Alertas, " & totalCrit & " Críticos.", vbInformation, "Ouzo Bar"
End Sub

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
    wsReq.Cells(1, 1).Value = "OUZO RESTAURANTE - REQUISICION A BODEGA (PAR-LEVEL)"
    wsReq.Cells(2, 1).Value = "Fecha: " & Format(Now, "DD/MM/YYYY hh:mm")
    wsReq.Range("A3:F3").Value = Array("Código", "Producto", "Stock Actual", "Par-Level", "Pedido Sugerido", "Costo Aprox USD")
    wsReq.Range("A3:F3").Font.Bold = True
    wsReq.Range("A3:F3").Interior.Color = RGB(11, 27, 50)
    wsReq.Range("A3:F3").Font.Color = RGB(245, 158, 11)
    
    nextRowReq = 4: totalNeeded = 0: totalCost = 0
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
    
    wsReq.Columns("A:F").AutoFit
    wsReq.Activate
    MsgBox "Requisición generada: " & Format(totalNeeded, "0.0") & " botellas ($" & Format(totalCost, "0.00") & " USD)", vbInformation, "Bodega Par-Level"
End Sub

Public Sub ExportarAGoogleDrive()
    Dim driveFolder As String, backupPath As String, timeStamp As String
    timeStamp = Format(Now, "YYYYMMDD_hhmmss")
    driveFolder = Environ("USERPROFILE") & "\\Google Drive\\Ouzo Restaurante\\Inventarios Bar 2026\\"
    If Dir(driveFolder, vbDirectory) = "" Then
        driveFolder = Environ("USERPROFILE") & "\\Documents\\Ouzo_Inventarios\\"
        If Dir(driveFolder, vbDirectory) = "" Then MkDir driveFolder
    End If
    backupPath = driveFolder & "Inventario_Ouzo_Respaldo_" & timeStamp & ".xlsx"
    Application.DisplayAlerts = False
    ThisWorkbook.SaveCopyAs backupPath
    Application.DisplayAlerts = True
    MsgBox "Copia exportada para Google Drive:" & vbCrLf & backupPath, vbInformation, "Google Drive Sync"
End Sub

Public Sub LimpiarParaNuevoTurno()
    Dim ws As Worksheet, lastRow As Long
    If MsgBox("¿Deseas reiniciar los conteos físicos para el nuevo turno?", vbQuestion + vbYesNo, "Nuevo Turno") = vbNo Then Exit Sub
    Set ws = ThisWorkbook.Sheets("Control_Inventario")
    lastRow = ws.Cells(ws.Rows.Count, "B").End(xlUp).Row
    If lastRow >= 4 Then
        ws.Range("G4:G" & lastRow).Value = 0
        ws.Range("H4:H" & lastRow).Value = 0
        ws.Range("K4:K" & lastRow).Value = "Pendiente Conteo"
        ws.Range("K4:K" & lastRow).Interior.ColorIndex = xlNone
    End If
    MsgBox "Conteos físicos reiniciados.", vbInformation, "Ouzo Bar"
End Sub
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Macros_Ouzo_BarraExpress.bas"');
  res.send(vbaCode);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`BarraExpress server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
