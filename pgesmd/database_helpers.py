"""
Helper functions and SQL queries for database.py EnergyHistory class.

These helper functions use external variables - any variable that is passed as
input to the function will not be mutated.
"""

import heapq
import pandas as pd
import math


def calculate_baseline(self):
    cur = self.cursor
    cur.execute("SELECT date, min FROM day ORDER BY start")

    data = cur.fetchall()

    window = 14

    df = pd.DataFrame(data, columns=["Date", "Daily Minimum"])
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.set_index("Date")

    ra = df.rolling(window=window).mean()
    rs = df.rolling(window=window).std()

    rsra = zip(
        df["Daily Minimum"], ra["Daily Minimum"], rs["Daily Minimum"], list(df.index),
    )

    smooth = []
    for d_min, d_avg, d_std, date in rsra:
        hi = d_avg + (d_std)
        lo = d_avg - (d_std)
        if d_min < lo or d_min > hi:
            smooth.append((date, d_avg))
        else:
            smooth.append((date, d_min))

    df_smooth = pd.DataFrame(smooth, columns=["Date", "Daily Minimum"])
    df_smooth["Date"] = pd.to_datetime(df_smooth["Date"])
    df_smooth = df_smooth.set_index("Date")

    ra_smooth = df_smooth.rolling(window=window).mean()

    result = ra_smooth["Daily Minimum"]

    mean = [int(x) if not math.isnan(x) else x for x in result]
    mean = mean[window - 1 :]

    for remaining in range(window - 1, 0, -1):
        mean.append(
            int(
                mean[-1]
                - data[-window - remaining][1] / window
                + data[-remaining][1] / window
            )
        )

    dates = [x[0] for x in data]
    baseline = list(zip(mean, dates))

    for val, date in baseline:
        cur.execute("UPDATE day SET baseline=? WHERE date=?;", (val, date))


def insert_into_year(
    self, start, year_start, prev_date, year_sum, year_cnt, S_ONE_WEEK, pge_id
):
    middle = start - 26 * S_ONE_WEEK
    year_avg = int(round(year_sum / year_cnt))
    self.cursor.execute(
        """
        REPLACE INTO year (
            start,
            middle,
            end,
            date,
            year_avg,
            year_sum,
            pge_id)
        VALUES (?,?,?,?,?,?,?);""",
        (year_start, middle, start, prev_date, year_avg, year_sum, pge_id),
    )


def insert_into_month(
    self, start, month_start, prev_date, month_sum, month_cnt, ONE_MONTH, cur_datetime, pge_id
):
    middle = start - 86400 * 15
    month_avg = int(round(month_sum / month_cnt))
    self.cursor.execute(
        """
        REPLACE INTO month (
            start,
            middle,
            end,
            date,
            month_avg,
            month_sum,
            pge_id)
        VALUES (?,?,?,?,?,?,?);""",
        (month_start, middle, start, prev_date, month_avg, month_sum, pge_id),
    )


def insert_into_week(
    self, start, week_start, prev_date, week_sum, week_cnt, S_ONE_WEEK, pge_id
):
    week_avg = int(round(week_sum / week_cnt))
    self.cursor.execute(
        """
        REPLACE INTO week (
            start,
            middle,
            end,
            date,
            week_avg,
            week_sum,
            pge_id)
        VALUES (?,?,?,?,?,?,?);""",
        (week_start, week_start + S_ONE_WEEK / 2, start, prev_date, week_avg, week_sum, pge_id),
    )


def insert_into_day(
    self, start, day_start, prev_date, day_sum, day_cnt, S_ONE_DAY, min_heap, pge_id
):
    daily_min = heapq.nsmallest(1, min_heap)[0]
    day_avg = int(round(day_sum / day_cnt))
    self.cursor.execute(
        """
        REPLACE INTO day (
            start,
            middle,
            end,
            date,
            day_avg,
            day_sum,
            min,
            pge_id)
        VALUES (?,?,?,?,?,?,?,?);""",
        (
            day_start,
            day_start + S_ONE_DAY / 2,
            start,
            prev_date,
            day_avg,
            day_sum,
            daily_min,
            pge_id
        ),
    )


def insert_into_part(self, start, part_start, prev_date, part_sum, timezone, part_type, pge_id):
    part_end = start
    part_interval = part_end - part_start
    part_avg = int(round(part_sum / part_interval * 3600))
    part_middle = part_start + (part_interval / 2)
    #  Insert into the partitions table
    self.cursor.execute(
        """
        REPLACE INTO part (
            start,
            end,
            middle,
            date,
            part_type,
            part_avg,
            part_sum,
            pge_id)
        VALUES (?,?,?,?,?,?,?,?);
        """,
        (part_start, part_end, part_middle, prev_date, part_type, part_avg, part_sum, pge_id),
    )


def insert_into_hour(self, start, duration, value, watt_hours, date, part_type, pge_id):
    self.cursor.execute(
        """
    REPLACE INTO hour (
        start,
        middle,
        end,
        duration,
        value,
        watt_hours,
        date,
        part_type,
        pge_id)
    VALUES (?,?,?,?,?,?,?,?,?);
    """,
        (
            start,
            start + 1800,
            start + 3600,
            duration,
            value,
            watt_hours,
            date,
            part_type,
            pge_id,
        ),
    )

