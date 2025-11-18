import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function RFIDScanner() {
  const [excelData, setExcelData] = useState([]);
  const [cardcode, setCardcode] = useState("");
  const [result, setResult] = useState(null);

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

    // กรณี Excel ส่งมาเป็นตัวเลข serial date
    if (typeof value === "number") {
      const excelStart = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelStart.getTime() + value * 86400000);

      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const year = date.getUTCFullYear();

      return `${day}/${month}/${year}`;
    }

    // กรณีเป็น string เช่น "11/26/2025"
    const d = new Date(value);
    if (!isNaN(d)) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return value;
  };

  const handleScan = (e) => {
    const value = e.target.value.trim();
    setCardcode(value);

    if (value.length >= 8) {
      const found = excelData.find((row) => {
        return String(row.Cardcode).trim() === value + ":";
      });

      setResult(found || { error: "ไม่พบข้อมูลในระบบ" });

      // ⭐ ล้างช่อง input หลังสแกนเสร็จ
      setTimeout(() => {
        setCardcode("");
        inputRef.current?.focus();
      }, 200); // เว้นเล็กน้อยเพื่อให้ค่าทำงานก่อน
    }
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
            className="border border-gray-300 rounded-lg p-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
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
              <p className="text-red-600 font-bold text-center text-2xl">
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
