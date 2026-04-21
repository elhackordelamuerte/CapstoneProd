import asyncio
from sqlalchemy import update
from models.database import AsyncSessionLocal, Meeting

async def fix():
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Meeting)
            .where(Meeting.status == 'recording')
            .values(status='error', error_msg='Enregistrement interrompu')
          )
        await db.commit()
        print('Done')
          
    asyncio.run(fix())
