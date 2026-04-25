import sqlite3
c = sqlite3.connect('server_python/data/airops.sqlite')

tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
for t in tables:
    tname = t[0]
    cols = [x[1] for x in c.execute(f"PRAGMA table_info({tname})").fetchall()]
    
    # Check text columns
    for col in cols:
        try:
            r = c.execute(f"SELECT COUNT(*) FROM {tname} WHERE {col} LIKE '%AirOps%'").fetchone()
            if r and r[0] > 0:
                print(f"Table {tname}, Column {col} has {r[0]} rows containing 'AirOps'")
        except Exception:
            pass

c.close()
