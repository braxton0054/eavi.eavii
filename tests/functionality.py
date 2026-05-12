#!/usr/bin/env python3
import subprocess, json

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYmFhZGd4dG5aHBubnRvZ3pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQzMDk5NSwiZXhwIjoyMDkyMDA2OTk1fQ._VsySnWFyEPgfr_sIrOHcJq1Bq1XuMu26dRgEHsQwgc"
REST = "https://wgbaadgxtjyhpnntogzf.supabase.co/rest/v1"
BASE = "http://localhost:3000"

def get(table, select="*", params=""):
    url = f"{REST}/{table}?select={select}&{params}"
    r = subprocess.run(["curl","-s",url,"-H",f"apikey:{KEY}","-H",f"Authorization:Bearer {KEY}"], capture_output=True, text=True, timeout=10)
    try:
        return json.loads(r.stdout)
    except:
        print(f"  PARSE ERROR for {table}: {r.stdout[:100]}")
        return []

results = {"pass":0, "fail":0, "errors":[]}

def check(name, ok, detail=""):
    if ok:
        results["pass"] += 1
        print(f"  ✅ {name}")
    else:
        results["fail"] += 1
        results["errors"].append(name)
        print(f"  ❌ {name} {'— '+str(detail)[:80] if detail else ''}")

print("═══ FUNCTIONALITY TEST ═══\n")

# ── COURSE DATA ──
print("📚 1. COURSE STRUCTURE")
courses = get("courses","id,name","limit=50")
check("Courses exist", len(courses) >= 40, f"Got {len(courses)} items")
if not courses or len(courses) < 40:
    print(f"  Raw: {str(courses)[:200]}")
    import sys; sys.exit(1)

types = get("course_types","id,level","limit=60")
check("Course types", len(types) >= 40, f"Got {len(types)}")
mods = get("modules","id,module_index,label","limit=120")
check("Modules", len(mods) >= 80, f"Got {len(mods)}")
sems = get("semesters","id,semester_index,fee","limit=250")
check("Semesters", len(sems) >= 150, f"Got {len(sems)}")
units_t = get("units","unit_code,name","limit=400")
check("Units", len(units_t) >= 300, f"Got {len(units_t)}")

# Course chain
ct_id = types[0]["id"]
ct_mods = get("modules","id,module_index",f"course_type_id=eq.{ct_id}&limit=20")
check("Course type has modules", len(ct_mods) > 0, f"{len(ct_mods)}")
if ct_mods:
    ct_sems = get("semesters","id,semester_index,fee",f"module_id=eq.{ct_mods[0]['id']}&limit=10")
    check("Module has semesters", len(ct_sems) > 0)
    if ct_sems:
        check("Semester has fee > 0", float(ct_sems[0].get("fee",0)) > 0)

# ── APPLICATION ──
print("\n📝 2. APPLICATION SUBMISSION")
payload = json.dumps({
    "full_name":"Faith Chepkemoi Koech","first_name":"Faith","middle_name":"Chepkemoi","last_name":"Koech",
    "phone":"0711111152","kcse_grade":"B+","exam_body":"KNEC","intake":"September 2026",
    "course_id":courses[0]["id"],"course_type_id":types[0]["id"],
    "campus":"main","enrollment_type":"new","admission_number":"FT004","application_date":"2026-05-12"
})
r = subprocess.run(["curl","-s","-X","POST",f"{BASE}/api/apply",
    "-H","Content-Type: application/json","-d",payload], capture_output=True, text=True, timeout=15)
resp = json.loads(r.stdout)
d = resp.get("data",{})
check("API success", resp.get("success"), str(resp.get("error","")))
check("  full_name=Faith...Koech", d.get("full_name")=="Faith Chepkemoi Koech")
check("  first_name=Faith", d.get("first_name")=="Faith")
check("  middle_name=Chepkemoi", d.get("middle_name")=="Chepkemoi")
check("  last_name=Koech", d.get("last_name")=="Koech")

# Verify DB
app_id = d.get("id","")
apps_db = get("applications","status,first_name,last_name",f"id=eq.{app_id}&limit=1")
if apps_db:
    check("DB status=pending", apps_db[0].get("status")=="pending")
    check("DB first_name", apps_db[0].get("first_name")=="Faith")
    check("DB last_name", apps_db[0].get("last_name")=="Koech")

# Profile
prof = get("student_profiles","id",f"application_id=eq.{app_id}&limit=1")
check("Student profile created", len(prof)>0)

# ── ENROLL ──
print("\n🎓 3. ENROLLMENT")
url = f"{REST}/applications?id=eq.{app_id}"
r = subprocess.run(["curl","-s","-X","PATCH",url,
    "-H",f"apikey:{KEY}","-H",f"Authorization:Bearer {KEY}",
    "-H","Content-Type: application/json",
    "-d",json.dumps({"status":"enrolled","current_semester":1,"current_module":1})],
    capture_output=True, text=True, timeout=10)
enrolled = get("applications","status,current_semester",f"id=eq.{app_id}&limit=1")
if enrolled:
    check("Status=enrolled", enrolled[0].get("status")=="enrolled")
    check("Semester=1", enrolled[0].get("current_semester")==1)

# ── FEE ──
print("\n💰 4. FEE VIEWS")
fv = get("v_course_fee_structure","*","limit=3")
check("Fee structure view", len(fv) > 0)
sf = get("v_student_fee_summary","*",f"application_id=eq.{app_id}&limit=5")
check("Student fee summary", len(sf) >= 0)

# ── LECTURER ──
print("\n👨‍🏫 5. LECTURERS")
lecs = get("lecturers","id,full_name,first_name,last_name","limit=10")
check("Lecturers exist", len(lecs) >= 1, f"Got {len(lecs)}")
for l in lecs:
    check(f"  {l['full_name']} has name parts", l.get("first_name") and l.get("last_name"))

# ── VIEWS ──
print("\n📊 6. DASHBOARD VIEWS")
cs = get("v_campus_summary","*","limit=3")
check("Campus summary", len(cs) > 0)
spc = get("v_students_per_course","*","limit=3")
check("Students per course", len(spc) > 0)

# ── RESULTS ──
print(f"\n{'='*50}")
print(f"RESULTS: {results['pass']} ✅  {results['fail']} ❌")
if results["errors"]:
    print(f"FAILED: {', '.join(results['errors'])}")
print(f"{'='*50}")
