-- Clear all records in safe order (respecting foreign key constraints)
delete from video_archives where 1=1;
delete from challenge_archives where 1=1;
delete from discord_members where 1=1;
