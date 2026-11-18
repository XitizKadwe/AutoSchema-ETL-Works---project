import csv
import io


def generate_sample_csv() -> bytes:
    rows = [
        ["application_id", "applicant_name", "district", "department", "email", "application_date", "status", "amount_inr"],
        ["APP-1001", "Aarav Mehta", "Pune", "Digital Services", "aarav@example.invalid", "2026-03-08", "submitted", "1250"],
        ["APP-1002", "  Diya Rao ", "Mysuru", "Public Works", "diya@example.invalid", "08/03/2026", "Pending", "900"],
        ["APP-1003", "Kabir Shah", "Surat", "Digital Services", "", "2026-03-09", "approved", "2100"],
        ["APP-1004", "Mira Nair", "Kochi", "Health Services", "mira@example.invalid", "2026-03-10", "submitted", "1500"],
        ["APP-1005", "Ishaan Das", "Kolkata", "Public Works", "ishaan@example.invalid", "2026-03-10", "pending", "0"],
        ["APP-1006", "Zoya Khan", "Jaipur", "Digital Services", "zoya@example.invalid", "2026-03-11", "approved", "3500"],
        ["APP-1006", "Zoya Khan", "Jaipur", "Digital Services", "zoya@example.invalid", "2026-03-11", "approved", "3500"],
        ["APP-1007", "Rohan Iyer", "", "Health Services", "rohan@example.invalid", "2026-03-12", "submitted", "875"],
        ["", "", "", "", "", "", "", ""],
        ["APP-1008", "Anaya Sen", "Bhopal", "Public Works", "anaya@example.invalid", "12/03/2026", "In Review", "1750"],
        ["APP-1009", "Vihaan Patel", "Ahmedabad", "Digital Services", "vihaan@example.invalid", "2026-03-13", "submitted", "2200"],
    ]
    output = io.StringIO(newline="")
    csv.writer(output).writerows(rows)
    return output.getvalue().encode("utf-8")
