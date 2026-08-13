"use client";

import { useState } from "react";

// Thuật toán tuổi nghỉ hưu chuẩn theo NĐ 135/2020
function calculateTargetRetirementAge(isMale: boolean, bYear: number, bMonth: number) {
    let baseAge = isMale ? 60 : 55;
    let maxAge = isMale ? 62 : 60;
    let stepMonths = isMale ? 3 : 4;
    let baseYear = isMale ? 1961 : 1966;
    
    let ageYears = baseAge;
    let ageMonths = 0;

    if (bYear >= baseYear) {
        let monthsDiff = (bYear - baseYear) * 12 + (bMonth - 1);
        let steps = Math.floor(monthsDiff / (12 - stepMonths)) + 1;
        let totalExtraMonths = steps * stepMonths;
        
        let maxExtra = (maxAge - baseAge) * 12;
        if (totalExtraMonths > maxExtra) totalExtraMonths = maxExtra;
        
        ageYears = baseAge + Math.floor(totalExtraMonths / 12);
        ageMonths = totalExtraMonths % 12;
    }
    return { y: ageYears, m: ageMonths };
}

function formatVND(num: number) {
    return Math.round(num).toLocaleString('vi-VN') + " đ";
}

function calculateRetirementSalary(currentCoefficient: number, currentYear: number, retirementYear: number, currentVuotKhung = 0) {
    const scales = [
        { name: "A1", step: 0.33, max: 4.98, coeffs: [2.34, 2.67, 3.00, 3.33, 3.66, 3.99, 4.32, 4.65, 4.98] },
        { name: "A2.2", step: 0.34, max: 6.38, coeffs: [4.00, 4.34, 4.68, 5.02, 5.36, 5.70, 6.04, 6.38] },
        { name: "A2.1", step: 0.34, max: 6.78, coeffs: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78] }
    ];

    let currentScale = scales.find(scale => 
        scale.coeffs.some(c => Math.abs(c - currentCoefficient) < 0.01)
    ) || scales[0];

    let coeff = currentCoefficient;
    let vk = currentVuotKhung; 
    let yearsUntilNextRaise = 3; 
    
    if (vk > 0) {
        yearsUntilNextRaise = 1;
    }

    for (let year = currentYear + 1; year <= retirementYear; year++) {
        yearsUntilNextRaise--;

        if (yearsUntilNextRaise === 0) {
            if (coeff < currentScale.max) {
                coeff = Math.round((coeff + currentScale.step) * 100) / 100;
                
                if (coeff >= currentScale.max) {
                    coeff = currentScale.max;
                    yearsUntilNextRaise = 3; 
                } else {
                    yearsUntilNextRaise = 3; 
                }
            } else {
                if (vk === 0) {
                    vk = 5; 
                } else {
                    vk += 1; 
                }
                yearsUntilNextRaise = 1; 
            }
        }
    }

    return {
        finalCoefficient: coeff,
        finalVuotKhung: vk,
        scaleApplied: currentScale.name
    };
}

export function Calculator() {
    const [gender, setGender] = useState("1");
    const [startJobYear, setStartJobYear] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const [startBHXHYear, setStartBHXHYear] = useState("");
    
    const [hsLuong, setHsLuong] = useState("");
    const [luongCoSo, setLuongCoSo] = useState("2530000");
    const [pcChucVu, setPcChucVu] = useState("0");
    const [pcVuotKhung, setPcVuotKhung] = useState("0");
    const [pcThamNien, setPcThamNien] = useState("0");
    const [pcUuDai, setPcUuDai] = useState("0");
    const [pcKhuVuc, setPcKhuVuc] = useState("0");

    const [condHeavy, setCondHeavy] = useState(false);
    const [condRegion, setCondRegion] = useState(false);
    const [condCap61, setCondCap61] = useState(false);
    const [condCap81, setCondCap81] = useState(false);

    const [desiredRetMonth, setDesiredRetMonth] = useState("");
    const [desiredRetYear, setDesiredRetYear] = useState("");

    const [activeTab, setActiveTab] = useState("baoluu");

    const [errorMsg, setErrorMsg] = useState("");
    const [resultData, setResultData] = useState<any>(null);

    const handleCalculate = () => {
        setErrorMsg("");
        setResultData(null);

        const isMale = gender === "1";
        const bMonth = parseInt(birthMonth);
        const bYear = parseInt(birthYear);
        const startBHXH = parseInt(startBHXHYear);
        const startJob = parseInt(startJobYear);
        
        const hsl = parseFloat(hsLuong) || 0;
        const lcs = parseFloat(luongCoSo) || 2530000;
        const pccv = parseFloat(pcChucVu) || 0;
        const pcvk = parseFloat(pcVuotKhung) || 0;
        const pctn = parseFloat(pcThamNien) || 0;
        const pcud = parseFloat(pcUuDai) || 0;
        const pckv = parseFloat(pcKhuVuc) || 0;
        
        const currentYear = new Date().getFullYear();

        if (!bMonth || !bYear || !startBHXH || !hsl) {
            setErrorMsg("Vui lòng nhập đầy đủ các ô có thông tin bắt buộc!");
            return;
        }

        // TÍNH TOÁN TIỀN LƯƠNG HIỆN TẠI
        let hsVuotKhung = hsl * (pcvk / 100);
        let hsThamNien = (hsl + pccv + hsVuotKhung) * (pctn / 100);
        let tongHeSoBHXH = hsl + pccv + hsVuotKhung + hsThamNien;
        
        let luongDongBHXH = tongHeSoBHXH * lcs;
        let tienUuDai = (hsl + pccv + hsVuotKhung) * (pcud / 100) * lcs;
        let tienKhuVuc = pckv * lcs;
        
        let tongThuNhap = luongDongBHXH + tienUuDai + tienKhuVuc;
        let tienTruBHXH = luongDongBHXH * 0.105; 
        let luongHienTai = tongThuNhap - tienTruBHXH;

        // TÍNH TUỔI VÀ THỜI ĐIỂM NGHỈ HƯU
        let targetAge = calculateTargetRetirementAge(isMale, bYear, bMonth);
        
        let deduction = 0;
        if (condCap81) deduction = 10;
        else if (condHeavy && condCap61) deduction = 10;
        else if (condHeavy || condRegion || condCap61) deduction = 5;

        targetAge.y -= deduction;
        
        let retDate = new Date(bYear + targetAge.y, (bMonth - 1) + targetAge.m);
        let retYear = retDate.getFullYear();
        let retStr = (retDate.getMonth() + 1).toString().padStart(2, '0') + "/" + retYear;
        let ageStr = targetAge.y + " tuổi " + (targetAge.m > 0 ? targetAge.m + " tháng" : "");

        const hasDesired = desiredRetMonth && desiredRetYear;
        if (hasDesired) {
            const dMonth = parseInt(desiredRetMonth);
            const dYear = parseInt(desiredRetYear);
            retDate = new Date(dYear, dMonth - 1);
            retYear = dYear;
            retStr = dMonth.toString().padStart(2, '0') + "/" + dYear + " (Theo nguyện vọng)";
            
            const totalMonthsDiff = (dYear - bYear) * 12 + (dMonth - bMonth);
            const dAgeY = Math.floor(totalMonthsDiff / 12);
            const dAgeM = totalMonthsDiff % 12;
            ageStr = dAgeY + " tuổi " + (dAgeM > 0 ? dAgeM + " tháng" : "");
        }

        const yearsPaid = retYear - startBHXH;
        if (yearsPaid < 15) {
            setErrorMsg(`Đến năm ${retYear} hệ thống dự tính thầy/cô mới đóng ${yearsPaid} năm BHXH (Luật yêu cầu tối thiểu 15 năm).`);
            return;
        }

        let yearsLeft = retYear - currentYear;
        if (yearsLeft < 0) yearsLeft = 0;
        let futurePcThamNien = pctn + yearsLeft; 

        let projected = calculateRetirementSalary(hsl, currentYear, Math.max(currentYear, retYear), pcvk);
        let futureHsLuong = projected.finalCoefficient;
        let futurePcVuotKhung = projected.finalVuotKhung;

        let fHsVuotKhung = futureHsLuong * (futurePcVuotKhung / 100);
        let fHsThamNien = (futureHsLuong + pccv + fHsVuotKhung) * (futurePcThamNien / 100);
        let fTongHeSoBHXH = futureHsLuong + pccv + fHsVuotKhung + fHsThamNien;
        let futureBaseSalary = fTongHeSoBHXH * lcs;

        let percent = 0;
        if (!isMale) {
            percent = 45 + (yearsPaid - 15) * 2;
        } else {
            if (yearsPaid < 20) percent = 40 + (yearsPaid - 15) * 1;
            else percent = 45 + (yearsPaid - 20) * 2;
        }
        
        if (percent > 75) percent = 75;
        if (percent < 0) percent = 0;

        let monthlyPension = futureBaseSalary * (percent / 100);

        let allowance = 0;
        let maxYears = isMale ? 35 : 30;
        if (yearsPaid > maxYears) {
            allowance = (yearsPaid - maxYears) * 0.5 * futureBaseSalary;
        }

        // TÍNH TRỢ CẤP THÔI VIỆC VÀ BHXH 1 LẦN
        let troCapThoiViec = 0;
        let yearsBefore2009 = 0;
        if (startJob && startJob < 2009) {
            yearsBefore2009 = 2009 - startJob;
            troCapThoiViec = yearsBefore2009 * 0.5 * futureBaseSalary;
        }

        let yearsBefore2014 = 0;
        let yearsAfter2014 = 0;
        let bhxh1Lan = 0;
        if (startBHXH < 2014) {
            yearsBefore2014 = 2014 - startBHXH;
            yearsAfter2014 = Math.max(0, retYear - 2014);
        } else {
            yearsAfter2014 = Math.max(0, retYear - startBHXH);
        }
        bhxh1Lan = (yearsBefore2014 * 1.5 + yearsAfter2014 * 2.0) * futureBaseSalary;

        setResultData({
            luongHienTai,
            retStr,
            ageStr,
            yearsPaid,
            futureBaseSalary,
            scaleApplied: projected.scaleApplied,
            futureHsLuong,
            futurePcVuotKhung,
            futurePcThamNien,
            percent,
            monthlyPension,
            allowance,
            hasDesired,
            troCapThoiViec,
            yearsBefore2009,
            bhxh1Lan,
            yearsBefore2014,
            yearsAfter2014
        });
    };

    const handleReset = () => {
        setGender("1");
        setStartJobYear("");
        setBirthMonth("");
        setBirthYear("");
        setStartBHXHYear("");
        setHsLuong("");
        setLuongCoSo("2530000");
        setPcChucVu("0");
        setPcVuotKhung("0");
        setPcThamNien("0");
        setPcUuDai("0");
        setPcKhuVuc("0");
        setCondHeavy(false);
        setCondRegion(false);
        setCondCap61(false);
        setCondCap81(false);
        setDesiredRetMonth("");
        setDesiredRetYear("");
        setActiveTab("baoluu");
        setErrorMsg("");
        setResultData(null);
    };

    return (
        <div className="app-container">
            <div className="header mb-[25px]">
                <h2 className="app-title font-bold">TÍNH CHẾ ĐỘ HƯU THEO LUẬT BHXH</h2>
                <h3 className="app-subtitle">Theo Số: 135/2020/NĐ-CP và Luật số: 41/2024/QH15 về Luật BHXH</h3>
            </div>

            {errorMsg && <div className="p-[12px] bg-[#ffcdd2] text-[#b71c1c] rounded-[8px] text-[14px] mb-[15px] font-bold shadow-[2px_2px_5px_rgba(0,0,0,0.1)]">{errorMsg}</div>}

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Giới tính</label>
                        <select className="form-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                            <option value="1">Nam</option>
                            <option value="0">Nữ</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Năm vào nghề</label>
                        <input type="number" className="form-input" placeholder="VD: 2000" value={startJobYear} onChange={(e) => setStartJobYear(e.target.value)} required />
                    </div>
                </div>

                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Tháng sinh</label>
                        <input type="number" className="form-input" min="1" max="12" placeholder="VD: 5" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} required />
                    </div>
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Năm sinh</label>
                        <input type="number" className="form-input" placeholder="VD: 1970" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required />
                    </div>
                </div>

                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Năm bắt đầu đóng BHXH</label>
                        <input type="number" className="form-input" placeholder="VD: 2001" value={startBHXHYear} onChange={(e) => setStartBHXHYear(e.target.value)} required />
                    </div>
                </div>

                <div className="section-title">CÁC THÔNG TIN VỀ LƯƠNG</div>
                
                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Hệ số lương</label>
                        <input type="number" className="form-input" step="0.01" placeholder="VD: 4.98" value={hsLuong} onChange={(e) => setHsLuong(e.target.value)} required />
                    </div>
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Mức lương cơ sở</label>
                        <input type="number" className="form-input" value={luongCoSo} onChange={(e) => setLuongCoSo(e.target.value)} required />
                    </div>
                </div>

                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">PC Chức vụ (Hệ số)</label>
                        <input type="number" className="form-input" step="0.01" value={pcChucVu} onChange={(e) => setPcChucVu(e.target.value)} />
                    </div>
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">PC Vượt khung (%)</label>
                        <input type="number" className="form-input" step="1" value={pcVuotKhung} onChange={(e) => setPcVuotKhung(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">PC Thâm niên (%)</label>
                        <input type="number" className="form-input" step="1" value={pcThamNien} onChange={(e) => setPcThamNien(e.target.value)} />
                    </div>
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">PC Ưu đãi (%)</label>
                        <input type="number" className="form-input" step="1" value={pcUuDai} onChange={(e) => setPcUuDai(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">PC Khu vực (Hệ số)</label>
                        <input type="number" className="form-input" step="0.1" value={pcKhuVuc} onChange={(e) => setPcKhuVuc(e.target.value)} />
                    </div>
                </div>

                <div className="section-title">ĐIỀU KIỆN ĐẶC BIỆT (NGHỈ HƯU SỚM)</div>
                <div className="flex items-start gap-[8px] mb-[12px]">
                    <input type="checkbox" id="condHeavy" className="mt-[3px] scale-[1.3] accent-[#1a73e8]" checked={condHeavy} onChange={(e) => setCondHeavy(e.target.checked)} />
                    <label htmlFor="condHeavy" className="checkbox-label">Làm nghề nặng nhọc, độc hại, nguy hiểm ≥ 15 năm</label>
                </div>
                <div className="flex items-start gap-[8px] mb-[12px]">
                    <input type="checkbox" id="condRegion" className="mt-[3px] scale-[1.3] accent-[#1a73e8]" checked={condRegion} onChange={(e) => setCondRegion(e.target.checked)} />
                    <label htmlFor="condRegion" className="checkbox-label">Làm việc vùng đặc biệt khó khăn ≥ 15 năm</label>
                </div>
                <div className="flex items-start gap-[8px] mb-[12px]">
                    <input type="checkbox" id="condCap61" className="mt-[3px] scale-[1.3] accent-[#1a73e8]" checked={condCap61} onChange={(e) => setCondCap61(e.target.checked)} />
                    <label htmlFor="condCap61" className="checkbox-label">Suy giảm khả năng lao động ≥ 61%</label>
                </div>
                <div className="flex items-start gap-[8px] mb-[12px]">
                    <input type="checkbox" id="condCap81" className="mt-[3px] scale-[1.3] accent-[#1a73e8]" checked={condCap81} onChange={(e) => setCondCap81(e.target.checked)} />
                    <label htmlFor="condCap81" className="checkbox-label">Suy giảm khả năng lao động ≥ 81%</label>
                </div>

                <div className="section-title">THỜI ĐIỂM NGHỈ HƯU THEO NGUYỆN VỌNG (TÙY CHỌN)</div>
                <div className="flex gap-[10px] flex-wrap mb-[15px]">
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Tháng nghỉ hưu</label>
                        <input type="number" className="form-input" min="1" max="12" placeholder="VD: 9" value={desiredRetMonth} onChange={(e) => setDesiredRetMonth(e.target.value)} />
                    </div>
                    <div className="flex-1 min-w-[45%]">
                        <label className="form-label">Năm nghỉ hưu</label>
                        <input type="number" className="form-input" placeholder="VD: 2028" value={desiredRetYear} onChange={(e) => setDesiredRetYear(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-[10px] mt-[20px]">
                    <button type="button" className="flex-1 text-white border-none p-[14px] rounded-[10px] text-[15px] font-bold cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.2)] transition-all active:translate-y-[2px] active:shadow-[0_2px_3px_rgba(0,0,0,0.2)] btn-calc" onClick={handleCalculate}>TÍNH TOÁN</button>
                    <button type="button" className="flex-1 text-white border-none p-[14px] rounded-[10px] text-[15px] font-bold cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.2)] transition-all active:translate-y-[2px] active:shadow-[0_2px_3px_rgba(0,0,0,0.2)] btn-reset" onClick={handleReset}>LÀM LẠI</button>
                </div>
            </form>

            {resultData && (
                <div className="mt-[25px] border-t-2 border-[#003366] pt-[20px]">
                    <div className="result-card">
                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Mức lương hiện tại (Thực nhận sau BHXH)</div>
                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]" style={{ color: '#003366' }}>{formatVND(resultData.luongHienTai)}</div>
                    </div>

                    <div className="result-card">
                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Thời điểm dự kiến nghỉ hưu</div>
                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{resultData.retStr}</div>
                        <div className="text-[13px] text-[#003366] mt-[4px] font-semibold">Tuổi: {resultData.ageStr} | Năm đóng BHXH: {resultData.yearsPaid} năm</div>
                    </div>
                    
                    <div className="result-card">
                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Dự kiến mức lương & Hệ số khi nghỉ hưu</div>
                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]" style={{ color: '#003366' }}>{formatVND(resultData.futureBaseSalary)} (Ghi nhận đóng BHXH)</div>
                        <div className="text-[13px] text-[#003366] mt-[4px] font-semibold">Ngạch: {resultData.scaleApplied} | Hệ số: {resultData.futureHsLuong.toFixed(2)} | Vượt khung: {resultData.futurePcVuotKhung}% | Thâm niên: {resultData.futurePcThamNien}%</div>
                    </div>

                    {resultData.hasDesired ? (
                        <div className="mt-[20px]">
                            <div className="flex gap-[10px] mb-[15px]">
                                <button 
                                    type="button"
                                    className={`flex-1 py-[12px] px-[4px] rounded-[10px] font-bold text-[13.5px] whitespace-nowrap text-white transition-all duration-200 border-none cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.15)] ${activeTab === 'baoluu' ? 'bg-[#2e7d32] scale-[1.03] shadow-[0_6px_10px_rgba(46,125,50,0.4)]' : 'bg-[#4caf50] opacity-85 hover:opacity-100 hover:scale-[1.02]'}`}
                                    onClick={() => setActiveTab('baoluu')}
                                >
                                    C.Độ 1: Bảo lưu chờ hưu
                                </button>
                                <button 
                                    type="button"
                                    className={`flex-1 py-[12px] px-[4px] rounded-[10px] font-bold text-[13.5px] whitespace-nowrap text-white transition-all duration-200 border-none cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.15)] ${activeTab === 'rut1lan' ? 'bg-[#e65100] scale-[1.03] shadow-[0_6px_10px_rgba(230,81,0,0.4)]' : 'bg-[#ff9800] opacity-85 hover:opacity-100 hover:scale-[1.02]'}`}
                                    onClick={() => setActiveTab('rut1lan')}
                                >
                                    C.Độ 2: Rút BHXH 1 lần
                                </button>
                            </div>

                            {activeTab === 'baoluu' && (
                                <>
                                    <div className="result-card">
                                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Trợ cấp thôi việc (Cho {resultData.yearsBefore2009} năm trước 2009)</div>
                                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.troCapThoiViec)}</div>
                                    </div>
                                    <div className="result-card">
                                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Lương hưu hàng tháng khi đủ tuổi (Tỷ lệ <span id="resPercent">{resultData.percent}%</span>)</div>
                                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.monthlyPension)}/tháng</div>
                                    </div>
                                    {resultData.allowance > 0 && (
                                        <div className="result-card">
                                            <div className="text-[12.5px] text-[#555] uppercase font-bold">Trợ cấp một lần (Do đóng vượt khung)</div>
                                            <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.allowance)}</div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'rut1lan' && (
                                <>
                                    <div className="result-card">
                                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Trợ cấp thôi việc (Cho {resultData.yearsBefore2009} năm trước 2009)</div>
                                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.troCapThoiViec)}</div>
                                    </div>
                                    <div className="result-card">
                                        <div className="text-[12.5px] text-[#555] uppercase font-bold">Trợ cấp BHXH 1 lần</div>
                                        <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.bhxh1Lan)}</div>
                                        <div className="text-[13px] text-[#003366] mt-[4px] font-semibold">Gồm: {resultData.yearsBefore2014} năm trước 2014 & {resultData.yearsAfter2014} năm từ 2014</div>
                                    </div>
                                    <div className="text-[10.5px] sm:text-[11.5px] text-[#e60000] font-bold italic mt-[10px] text-center whitespace-nowrap">
                                        * Lựa chọn này đồng nghĩa với việc bạn sẽ không có lương hưu khi về già.
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="result-card">
                                <div className="text-[12.5px] text-[#555] uppercase font-bold">Lương hưu thực nhận khi nghỉ hưu (Tỷ lệ <span id="resPercent">{resultData.percent}%</span>)</div>
                                <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.monthlyPension)}/tháng</div>
                            </div>
                            
                            {resultData.allowance > 0 && (
                                <div className="result-card">
                                    <div className="text-[12.5px] text-[#555] uppercase font-bold">Trợ cấp một lần (Do đóng vượt khung)</div>
                                    <div className="text-[17px] font-black text-[#d32f2f] mt-[6px]">{formatVND(resultData.allowance)}</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="text-center text-[13px] text-[#003366] font-bold mt-[25px]">
                Made by Nguyễn Phi Hùng - Zalo 0938750424
            </div>
        </div>
    );
}
