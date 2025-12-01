import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function RFIDScanner() {
  const [excelData, setExcelData] = useState([]);
  const [cardcode, setCardcode] = useState("");
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const uniqueCount = new Set(logs.map((item) => item["รหัสพนักงาน"])).size;
  const inputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      setExcelData(json);
    };

    reader.readAsArrayBuffer(file);
  };

  const formatDate = (value) => {
    if (!value) return "";

    if (typeof value === "number") {
      const excelStart = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelStart.getTime() + value * 86400000);
      return date.toLocaleDateString("th-TH");
    }

    const d = new Date(value);
    if (!isNaN(d)) return d.toLocaleDateString("th-TH");

    return value;
  };

  const handleScan = (e) => {
    const value = e.target.value.trim();
    setCardcode(value);

    if (value.length >= 8) {
      const found = excelData.find(
        (row) => String(row.Cardcode).trim() === value + ":"
      );

      const now = new Date();
      const timeStr = now.toLocaleString("th-TH");
      const today = now.toLocaleDateString("th-TH");

      if (found) {
        const empId = found["Emp. ID"];

        // ตรวจสแกนซ้ำ
        const isDuplicate = logs.some(
          (log) => log["รหัสพนักงาน"] === empId && log["วันที่สแกน"] === today
        );

        if (isDuplicate) {
          setResult({
            error: "สแกนซ้ำ",
            duplicate: true,
          });
        } else {
          // บันทึก log ใหม่
          setLogs((prev) => [
            ...prev,
            {
              รหัสพนักงาน: empId,
              "ชื่อ - สกุล": `${found["คำนำหน้า"]} ${found["ชื่อ"]} ${found["นามสกุล"]}`,
              วันที่สแกน: today,
              เวลาที่สแกน: timeStr,
            },
          ]);

          // ตั้งค่าผลลัพธ์
          setResult({ ...found, scanTime: timeStr });
        }
      } else {
        setResult({ error: "ไม่พบข้อมูลในระบบ" });
      }

      setTimeout(() => {
        setCardcode("");
        inputRef.current?.focus();
      }, 200);
    }
  };

  const downloadLogsExcel = () => {
    if (logs.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scan Logs");
    XLSX.writeFile(workbook, "scan_logs.xlsx");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-blue-700">
          Scan รับของขวัญปีใหม่ 2026
        </h1>

        <div className="flex flex-col gap-4">
          <label className="font-medium">เลือกไฟล์ Excel</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="border border-gray-300 rounded-lg p-2 bg-gray-50 hover:bg-gray-100"
          />

          <label className="font-medium">แตะบัตร</label>
          <input
            ref={inputRef}
            type="text"
            value={cardcode}
            onChange={handleScan}
            placeholder="แตะบัตร RFID ที่นี่"
            autoFocus
            className="border text-2xl p-4 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {result && (
          <div className="mt-6 p-5 border rounded-xl bg-blue-50 shadow-inner text-xl">
            {result.error ? (
              <p
                className={`font-bold text-center text-2xl ${
                  result.duplicate ? "text-yellow-600" : "text-red-600"
                }`}
              >
                {result.error}
              </p>
            ) : (
              <div className="leading-relaxed text-2xl">
                <p>
                  <strong>Emp ID:</strong> {result["Emp. ID"]}
                </p>
                <p>
                  <strong>ชื่อ:</strong> {result["คำนำหน้า"]} {result["ชื่อ"]}{" "}
                  {result["นามสกุล"]}
                </p>
                <p>
                  <strong>วันที่รับของขวัญ:</strong>{" "}
                  {formatDate(result["วันที่รับของขวัญ"])}
                </p>
                <p>
                  <strong>เวลาสแกน:</strong> {result.scanTime}
                </p>
              </div>
            )}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-10 bg-white shadow-xl p-5 rounded-2xl">
            <h2 className="text-2xl font-bold mb-3 text-center text-green-700">
              ประวัติการสแกน
            </h2>

            {/* จำนวนคนที่สแกนแล้ว */}
            <h3 className="text-xl font-bold text-center text-blue-700 mt-2">
              จำนวนคนที่สแกนแล้ว:{" "}
              {new Set(logs.map((l) => l["รหัสพนักงาน"])).size} คน
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
              {logs.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-gray-50 text-lg"
                >
                  <p>
                    <strong>รหัสพนักงาน:</strong> {item["รหัสพนักงาน"]}
                  </p>
                  <p>
                    <strong>ชื่อ:</strong> {item["ชื่อ - สกุล"]}
                  </p>
                  <p>
                    <strong>วันที่:</strong> {item["วันที่สแกน"]}
                  </p>
                  <p>
                    <strong>เวลา:</strong> {item["เวลาที่สแกน"]}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={downloadLogsExcel}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl text-xl hover:bg-green-700"
            >
              ดาวน์โหลด Log เป็น Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
