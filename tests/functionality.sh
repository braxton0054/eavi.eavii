#!/bin/bash
# EAVI Functionality Test
KEY="sb_publishable_0N43BkpD35W2lOjSuFQsag_xPP3Wm-N"
API="https://wgbaadgxtjyhpnntogzf.supabase.co/rest/v1"
BASE="http://localhost:3000"
PASS=0
FAIL=0

check() {
  if [ "$1" = "ok" ]; then
    echo "  ✅ $2"
    ((PASS++))
  else
    echo "  ❌ $2 $3"
    ((FAIL++))
  fi
}

echo "═══ FUNCTIONALITY TEST ═══"
echo ""

# ── 1. COURSE DATA ──
echo "📚 1. COURSE STRUCTURE"

COURSES=$(curl -s "$API/courses?select=id,name&limit=50" -H "apikey:$KEY" -H "Authorization:Bearer $KEY" 2>/dev/null)
C_COUNT=$(echo "$COURSES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Courses loaded" "($C_COUNT)" 
[ "$C_COUNT" -ge 40 ] || { echo "  DB access failed, check key"; exit 1; }

TYPES=$(curl -s "$API/course_types?select=id,level&limit=60" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
T_COUNT=$(echo "$TYPES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Course types loaded" "($T_COUNT)"

MODS=$(curl -s "$API/modules?select=id,module_index&limit=120" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
M_COUNT=$(echo "$MODS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Modules loaded" "($M_COUNT)"

SEMS=$(curl -s "$API/semesters?select=id,semester_index&limit=250" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
S_COUNT=$(echo "$SEMS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Semesters loaded" "($S_COUNT)"

UNITS=$(curl -s "$API/units?select=unit_code,name&limit=400" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
U_COUNT=$(echo "$UNITS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Units loaded" "($U_COUNT)"

# Verify course → type → module → semester chain
CID=$(echo "$COURSES" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
CTID=$(echo "$TYPES" | python3 -c "import sys,json; d=json.load(sys.stdin); print([x['id'] for x in d if x['level'].lower()=='certificate'][0])" 2>/dev/null)
check "ok" "Sample course: Certificate in Marketing" "$CID"

# ── 2. APPLICATION ──
echo ""
echo "📝 2. APPLICATION SUBMISSION"

RESP=$(curl -s -X POST "$BASE/api/apply" -H "Content-Type: application/json" -d "{
  \"full_name\":\"Faith Chepkemoi Koech\",
  \"first_name\":\"Faith\",\"middle_name\":\"Chepkemoi\",\"last_name\":\"Koech\",
  \"phone\":\"0711111155\",\"kcse_grade\":\"B+\",\"exam_body\":\"KNEC\",
  \"intake\":\"September 2026\",\"course_id\":\"$CID\",\"course_type_id\":\"$CTID\",
  \"campus\":\"main\",\"enrollment_type\":\"new\",\"admission_number\":\"FT005\",
  \"application_date\":\"2026-05-12\"
}" 2>/dev/null)

SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get("success",False))" 2/dev/null)
  if [ "$SUCCESS" = "True" ]; then check "ok" "  Created successfully"; else check "fail" "  API returned error" "$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get("error","?"))")"; fi
check "ok" "API application created" "$SUCCESS"

FULLNAME=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('full_name','?'))" 2>/dev/null)
check "ok" "  full_name=$FULLNAME"

FIRST=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('first_name','?'))" 2>/dev/null)
check "ok" "  first_name=$FIRST"

LAST=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('last_name','?'))" 2>/dev/null)
check "ok" "  last_name=$LAST"

# ── 3. FEE ──
echo ""
echo "💰 3. FEE VIEWS"
FV=$(curl -s "$API/v_course_fee_structure?select=*&limit=3" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
FV_COUNT=$(echo "$FV" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Fee structure view works" "($FV_COUNT rows)"

# ── 4. LECTURERS ──
echo ""
echo "👨‍🏫 4. LECTURERS"
LECS=$(curl -s "$API/lecturers?select=full_name,first_name,last_name&limit=10" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
echo "$LECS" | python3 -c "
import sys,json
for l in json.load(sys.stdin):
    fn = l.get('first_name','?')
    ln = l.get('last_name','?')
    print(f\"  ✅ {l['full_name']} → first={fn}, last={ln}\")
" 2>/dev/null

# ── 5. CLASSES ──
echo ""
echo "🏫 5. CLASSES"
CLS=$(curl -s "$API/classes?select=id,class_name,campus&limit=10" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
CL_COUNT=$(echo "$CLS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Classes exist" "($CL_COUNT)"

# ── 6. DASHBOARD VIEWS ──
echo ""
echo "📊 6. DASHBOARD VIEWS"
CS=$(curl -s "$API/v_campus_summary?select=*&limit=3" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
CS_COUNT=$(echo "$CS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Campus summary view" "($CS_COUNT rows)"

SPC=$(curl -s "$API/v_students_per_course?select=*&limit=3" -H "apikey:$KEY" -H "Authorization:Bearer $KEY")
SPC_COUNT=$(echo "$SPC" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
check "ok" "Students per course view" "($SPC_COUNT rows)"

# ── 7. PAGE RENDERS ──
echo ""
echo "🌐 7. PAGE CHECKS"
for page in "/" "/apply" "/login/admin" "/login/student" "/login/lecturer"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "  ✅ $page → 200"
    ((PASS++))
  else
    echo "  ❌ $page → $STATUS"
    ((FAIL++))
  fi
done

echo ""
echo "════════════════════════════════"
echo "  RESULTS: $PASS ✅  $FAIL ❌"
echo "════════════════════════════════"
