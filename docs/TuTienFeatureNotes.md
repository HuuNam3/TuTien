# Note phat trien tinh nang game tu tien 1 vs 1

Ngay cap nhat: 2026-08-19

## Muc tieu hien tai

Game dang di theo huong mobile tu tien 1 vs 1:

- Nguoi choi vuot pho ban theo tung tang.
- Danh thang nhan tu vi va co ti le roi trang bi.
- Du tu vi thi dot pha tieu canh gioi.
- Dai canh gioi moi can dieu kien dac biet.
- Trang bi lam tang luc chien va chi so chien dau.

Vong lap chinh nen giu:

`Danh pho ban -> nhan tu vi/do roi -> mac trang bi -> tang luc chien -> vuot tang cao hon -> dot pha canh gioi`

## He thong nen lam tiep

### 1. Nhiem vu chinh

Tac dung: Cho nguoi choi muc tieu ro rang, khong bi cam giac chi bam danh lap lai.

Vi du nhiem vu:

- Vuot Tang 1.
- Mac 1 trang bi.
- Dat luc chien 500.
- Dot pha Thoi The Nhi tang.
- Vuot Tang 5.
- Nhat 1 mon Linh pham.

Du lieu can co:

- `QuestData`
- `questId`
- `name`
- `conditionType`
- `conditionValue`
- `rewardTuVi`
- `rewardItem`
- `isCompleted`

Nen lam som vi no dan nguoi choi di qua cac he thong da co.

### 2. Cuong hoa trang bi

Tac dung: Bien trang bi thanh thu co the dau tu lau dai, khong chi nhat cai nao manh thi mac cai do.

Co che don gian:

- Moi trang bi co cap cuong hoa: `+0 -> +10`.
- Cuong hoa ton linh thach.
- Moi cap tang chi so chinh cua trang bi.
- Cap cao hon ton nhieu linh thach hon.

Vi du:

- Kiem +1: Cong +3%.
- Ao giap +1: Sinh luc +3%.
- Nhẫn +1: Linh luc +3%.

Du lieu can co:

- `EquipmentEnhanceData`
- `enhanceLevel`
- `cost`
- `statMultiplier`
- `successRate` neu sau nay muon co ti le thanh cong.

### 3. Linh thach

Tac dung: Lam tien te chinh cho cuong hoa, mua vat pham, luyen dan.

Nguon nhan:

- Thang pho ban.
- Nhiem vu.
- Ban trang bi thua.
- Bi canh linh thach.

Nen them cung luc voi cuong hoa trang bi.

### 4. Ban / phan giai trang bi

Tac dung: Giai quyet tui do bi day va tao tai nguyen phu.

Co che:

- Trang bi khong dung co the ban lay linh thach.
- Hoac phan giai lay nguyen lieu cuong hoa.

Vi du:

- Pham pham: +10 linh thach.
- Linh pham: +30 linh thach.
- Huyen pham: +80 linh thach.

### 5. Dong phu ngau nhien cua trang bi

Tac dung: Tao cam giac san do va build nhan vat.

Hien tai moi trang bi co chi so co dinh. Sau nay co the them dong phu:

- +Cong
- +Sinh luc
- +Thu
- +Ne tranh
- +Do don
- +Chi mang
- +Sat thuong chi mang

Co che de lam ban dau:

- Pham pham: 0-1 dong phu.
- Linh pham: 1-2 dong phu.
- Huyen pham: 2-3 dong phu.

### 6. Bo trang bi

Tac dung: Lam nguoi choi co ly do gom tron bo, khong chi so mon nao luc chien cao hon.

Vi du bo Thanh Cuong:

- 2 mon: Cong +10.
- 4 mon: Tuyet Anh Kiem gay them 20% sat thuong.
- 6 mon: Dau tran hoi 20 linh luc.

Du lieu can co:

- `EquipmentSetData`
- `setId`
- `setName`
- `requiredPieces`
- `bonusType`
- `bonusValue`

### 7. Tam phap

Tac dung: Day la he thong rat hop voi tu tien, dung de tao build chien dau.

Vi du tam phap:

- `Cuong Kiem Quyet`: Tang cong.
- `Ho The Chan Kinh`: Tang thu va do don.
- `Linh Tuyen Tam Phap`: Tang hoi linh luc.
- `Huyet Chien Quyet`: Tang chi mang nhung giam thu.

Ban dau chi can cho mac 1 tam phap.

Du lieu can co:

- `MindMethodData`
- `name`
- `quality`
- `level`
- `statBonus`
- `passiveEffect`

### 8. Cong phap / bi kip ky nang

Tac dung: Nang cap skill hien co ma khong can them qua nhieu skill moi.

Vi du voi `Tuyet Anh Kiem`:

- Tang sat thuong tu 140% len 150%.
- Giam ton linh luc tu 20 xuong 18.
- Giam hoi chieu tu 2 luot xuong 1 luot.
- Them pha giap 1 luot.

Du lieu can co:

- `SkillBookData`
- `skillId`
- `level`
- `damageMultiplier`
- `manaCost`
- `cooldown`
- `extraEffect`

### 9. Linh thu / ho phap

Tac dung: Tao he thong dong hanh, rat hop mobile va tu tien.

Ban dau nen lam don gian:

- Linh thu khong ra don rieng.
- Chi cong chi so thu dong.

Vi du:

- Linh Ho: +Ne tranh.
- Huyen Quy: +Sinh luc va Thu.
- Hoa Dieu: +Chi mang.
- Bach Lang: +Cong.

Sau nay moi them linh thu tan cong phu.

### 10. Luyen dan

Tac dung: Tao he thong vat pham va nguyen lieu.

Dan duoc co the co:

- `Tu Vi Dan`: Cong tu vi.
- `Hoi Sinh Dan`: Hoi sinh luc.
- `Tu Linh Dan`: Hoi linh luc.
- `Cuong The Dan`: Tang sinh luc tam thoi.
- `Truc Co Dan`: Dieu kien dot pha dai canh gioi.

Nen lam sau khi co `ItemData` va `DropTableData`.

### 11. Bi canh phu

Tac dung: Tach noi farm tai nguyen khoi pho ban chinh.

Vi du:

- Bi canh trang bi: farm do.
- Bi canh linh thach: farm tien.
- Bi canh dan duoc: farm nguyen lieu luyen dan.
- Bi canh cong phap: farm bi kip.

### 12. Tu luyen offline

Tac dung: Hop voi game mobile/idle.

Co che don gian:

- Moi phut nhan mot it tu vi.
- Gioi han tich luy, vi du 2 gio dau.
- Khi mo game co nut `Nhan tu vi`.

Nen de sau khi he thong tu vi/dot pha on dinh.

## Thu tu uu tien de lam

1. Nhiem vu chinh.
2. Linh thach.
3. Cuong hoa trang bi.
4. Ban/phan giai trang bi.
5. Dong phu ngau nhien cua trang bi.
6. Tam phap.
7. Bi kip ky nang.
8. Linh thu/ho phap.
9. Luyen dan.
10. Bi canh phu.
11. Tu luyen offline.

## De xuat cho ban demo hien tai

Nen lam tiep theo: `Nhiem vu chinh + Linh thach + Cuong hoa trang bi`.

Ly do:

- Da co pho ban.
- Da co trang bi.
- Da co luc chien.
- Da co tu vi va dot pha.

Chi can them 3 he thong nay thi vong lap game se ro hon:

`Vuot tang -> nhan tu vi/linh thach/do -> cuong hoa/mat do -> tang luc chien -> vuot tang tiep`

## Quy uoc kiem thu web

- Khi kiem tra ban demo tren web, luon giu hien cong cu thiet bi/device tools.
- Khong an hoac dong cong cu thiet bi trong qua trinh kiem tra giao dien.
- Kich thuoc viewport chuan de danh gia giao dien mobile la `390x850`.
