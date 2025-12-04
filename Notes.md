Understand, radix is like primitive of shadcn/ui. I was confused because i didn't see anywhere shadcn/ui in files. And we don't need to install it additionally.

Lets talk about features what we need to create first and main ideas. I checked other apps a little bit and want to have some functions from there, but i have no idea how to do it in my way. First of all we should have the same customisable page (like show or hide elements and change styles) with countdown clock (it can be used during shift to open and see remaining hours), also we can have regular clock to see the current time. And a simple manual counter (for example to track qty of pauses during the shift). Also we need to show shift type on this page (i thought it should be shown in the header as a dropdown but now i think it's a bad idea and we should keep it inside the page). This app should be mobile first layout. So it was the first page. Also we need to be able to create shifts and also keep ability for custom shift during the day. I don't know where to create shifts. So i don't know exactly what and how to show on other pages, so here is my expectations from the app:  i want to be able to create shifts, i can have different jobs and different salaries so i can create shifts for different jobs. Shift type should have start time and end time too. I want to be able to choose for each day what type of shift i have (including job because i can have two shifts from different jobs in one day), if i have no such type  can add custom shift for single day, also i want to be able to record overtime and undertime. I want to have ability to make notes for each shift. I want to see something like bar charts for week, 10 days, 2 weeks or month to see the progress during the month or last days. I want to be able to set periods where the salary should be counted. And see calculations of salary for periods (and be able to see previous monthes). Also i want to see expected working hours for month (or else period) and current progress. Also have ability to count salary for overtimes or undertimes if salary for day or per hour changes. Also we can have fines (penaltys) or premiums during the day and i want to be able to record it too and have notes for them and count them in statistiks too. As it's a web application i assume that we can not make push notifications to the mobile (i thought of question like "Have you done your shift for today? Don't forget to record your progress"). Maybe we can also have ability to start a timer to track shift live. Also holidays can be paid with different salary amount so we should mark it somehow to. Also i want to have dark theme and light theme, and by default we should have dark theme. I feel like i overcomplicate it and we can keep it more simple but i want to have a lot of functionality. Also if there is two types of salaries (per day and per hour) we should be able to make record comfortabely for both cases. Also good to have calendar view to see what days was with work or free. 

That was my main thoughts about app abilities. 
Please think of it, maybe you can combine this all to structured logical view.  You can check other apps logic or just think of possible issues and possible scenarios where we need this app and maybe some additional logic cases to record. 
You can ask me questions and have a disscuss with me about this app so we can get more and deeper understanding of what to do.




1. How many jobs typically? 1-2 or could be 5+? - I think this parameter should be scalable. For example if i want to have history of my life and jobs where i worked i can have more than 2 jobs. So some jobs can be even hidden to not be in the view if not needed. So we should have full job and shift managing.

2. Job settings per user? Each job needs: name, base salary (hourly/daily), overtime rate, currency? - Yes, sometimes overtime rates can be different so we should have rate and other free way to record salary for the day. Also it will be a good idea to add currency and ability to convert salary amount to another currency just to see (for example 1 month of work in UAH and be able to see how many USD it is)

3. Are D, M, N, D12, N12 universal? Or different per job?
Example: Job A night shift = 22:00-06:00, Job B night shift = 00:00-08:00? - Not universal, each shift shoud be created and named manually, also all settings of the shift should be setted up manually i think.

4. Overtime calculation logic?
Example: First 2 hours = 1.5x rate, after that 2x rate?
Or simple: all overtime = fixed multiplier?
 I can't tell how to do it right, i'd like to have ability to make records in different ways, both is okay, also here can be a case when owertimes will cost the same and no rates, so we need to cover all possible real life cases.

5. Holiday pay: Is it just a multiplier (like 2x salary) or fixed amount? - the same, hard to tell, both variants are good, there can be different scenarios, we need to cover all possible real life cases. 

6. Penalties/Bonuses:
Fixed amounts? Or percentages?
Example: "Late arrival: -50 currency" or "-10% of daily rate"
- should be different scenarios

7. Live timer: Do you want to START a timer when shift begins, STOP when it ends? (Like a stopwatch) - Yes

8. Or manual entry: Just record start/end times after shift is done? - also yes, it's good to have ability to track shifts with custom time.

9. Store last 3 months only? Or keep all history for salary calculations? - for now lets keep all data.

10. Export data: Need CSV/PDF export for salary reports? - yes, good to have, and also history for different periods



Answer these so I can design the database properly:
1. Start simple or build everything at once? (I strongly recommend MVP first) - i'm afraid of revriting everything if after mvp new features needs to rewrite all project, but if you suggest how to do correct mvp to not have problems in adding features in the future so lets do mvp first.
2. For MVP: One job or multiple jobs from the start? - multiple jobs.
3. Primary use case: Hourly rate or daily rate? (We can support both, but which is YOUR main case?) main case is pay for hour, so i assume hourly rate.
4. Overtime rule: Simple multiplier (e.g., 1.5x) or complex tiers? - complex tiers, because we can have mulltiplier, fixed value or the same value as usual working hour.
5. Most important feature: What do you use MOST? Dashboard clock? Salary calculations? Calendar tracking? - for now main things are Dashboard clock to check countdown to the shift and second one is shift tracking in calendar, after that we can move to salary calculations
6. PWA Notifications: Actually, PWA CAN send push notifications! Want this feature? (User must grant permission) - if we can it would be great! We can use it in some cases to remember user to track the time or something else