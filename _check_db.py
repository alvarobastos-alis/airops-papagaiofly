import sqlite3
c = sqlite3.connect('server_python/data/airops.sqlite')
tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", [t[0] for t in tables])

# Find PNR data
for t in tables:
    tname = t[0]
    cols = [x[1] for x in c.execute(f"PRAGMA table_info({tname})").fetchall()]
    if 'pnr' in [col.lower() for col in cols]:
        print(f"\nTable '{tname}' has PNR column. Columns: {cols}")
        row = c.execute(f"SELECT * FROM {tname} WHERE pnr='DEMO03'").fetchone()
        if row:
            print(f"DEMO03 data: {dict(zip(cols, row))}")

# Check for airline references
for t in tables:
    tname = t[0]
    cols = [x[1] for x in c.execute(f"PRAGMA table_info({tname})").fetchall()]
    if 'airline' in [col.lower() for col in cols]:
        print(f"\nTable '{tname}' has airline column")
        sample = c.execute(f"SELECT DISTINCT airline FROM {tname} LIMIT 5").fetchall()
        print(f"Values: {sample}")

c.close()
