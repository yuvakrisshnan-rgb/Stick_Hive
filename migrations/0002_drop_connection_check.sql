-- Migration number: 0002 	 2026-09-16T06:02:57.421Z
--
-- Task 1's vinext + D1 connection round-trip is verified — drop the
-- throwaway table from 0001, real schema migrations start from 0003.

DROP TABLE d1_connection_check;
