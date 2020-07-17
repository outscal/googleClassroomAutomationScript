function myFunction(){
  var courseId=getClassroomId('iat2qpv');
  var topics=Classroom.Courses.Topics.list(courseId).topic;
  var classroom=Classroom.Courses.CourseWork.list(courseId)
 // Logger.log(classroom);
}

//Student Progress
function studentProgress(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("Student Progress");
  var enrolmentCode=sheet.getRange(2,1).getValue();
  var courseId=getClassroomId(enrolmentCode);
  var students=Classroom.Courses.Students.list(courseId);
  var studentsList=students.students;
  if(students){
    var token=students.nextPageToken;
    while(token){
      var optionalArgs={
        "pageSize":50,
        "pageToken":token,
      }
      var newStudents=Classroom.Courses.Students.list(courseId,optionalArgs);
      Logger.log(newStudents.students.length);
      studentsList=studentsList.concat(newStudents.students)
      token=newStudents.nextPageToken;
    }
    
    for(var i=0;i<studentsList.length;i++){
      sheet.getRange(i+2,3).setValue(studentsList[i].profile.name.fullName);
      sheet.getRange(i+2,4).setValue(studentsList[i].profile.emailAddress);
    }
  }
}

// Due dates notifier
function dueDates(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("Due dates notifier");
 // sheet.getRange(14, 5).setValue("Processing").setBackground("blue").setFontColor("white");
  var numRows = sheet.getLastRow() - 2 + 1;
  if(numRows>0){
    var range1 = sheet.getRange(2, 1, numRows);
    var range2 = sheet.getRange(2, 2, numRows);
    var range3 = sheet.getRange(2, 3, numRows);
    range1.clear();range2.clear();range3.clear();
  }
  var optionalArgs={
    courseStates:"ACTIVE"
  }
  var courses=Classroom.Courses.list(optionalArgs).courses;
  for(var i=0;i<courses.length;i++){
      sheet.getRange(i+2, 1).setValue(courses[i].name);
      sheet.getRange(i+2,2).setValue(courses[i].enrollmentCode);
      var courseId=getClassroomId(courses[i].enrollmentCode);
      var optionalArgs={
        orderBy:"dueDate desc",
      }
      var classWorks=Classroom.Courses.CourseWork.list(courseId,optionalArgs).courseWork;
      if(classWorks){
        sheet.getRange(i+2, 3).setValue(classWorks[0].title);
        if(classWorks[0].dueDate)
          sheet.getRange(i+2,4).setValue(classWorks[0].dueDate.month+"/"+classWorks[0].dueDate.day+"/"+classWorks[0].dueDate.year);
        else if(sheet.getRange(i+2,5).getValue()=='YES'){
          var emailAdd='shubham.behl@outscal.com';
          var message='Classroom Name:'+courses[i].name+" Classroom Code:"+courses[i].enrollmentCode;
          var subject='Missing due date on classroom';
          //Logger.log("ran");
          MailApp.sendEmail(emailAdd,subject,message);
        }
          
      }
      else if(sheet.getRange(i+2,5).getValue()=='YES' || sheet.getRange(i+2,5).getValue()==''){
        var emailAdd='shubham.behl@outscal.com';
        var message='Classroom Name:'+courses[i].name+" Classroom Code:"+courses[i].enrollmentCode;
        var subject='Missing due date on classroom';
       // Logger.log("ran");
        MailApp.sendEmail(emailAdd,subject,message);
    }
  }
}


// Delete a section
function deleteSection(){
  try{
    
    var sheet = SpreadsheetApp.getActive().getSheetByName("Delete a section");
    sheet.getRange(14, 5).setValue("Processing").setBackground("blue").setFontColor("white");
    var lastRow=getLastDataRow(sheet);
    for(var i=2;i<=lastRow;i++){
      sheet.getRange(i, 3).setValue("Deleting!");
      var topicId=sheet.getRange(i,1).getValue().toString();
      //Logger.log(topicId);
      var enrolmentCode=sheet.getRange(i,2).getValue();
      var courseId=getClassroomId(enrolmentCode);
      var optionalArgsDraft={
        courseWorkStates:"DRAFT"
      }
      var classWorksDraft = Classroom.Courses.CourseWork.list(courseId, optionalArgsDraft).courseWork;
      if(classWorksDraft){
        for(var j=0;j<classWorksDraft.length;j++){
          //Logger.log(classWorks[j].title);
          //Logger.log(classWorks[j].topicId + " "+topicId );
          if(classWorksDraft[j].topicId === topicId){
            
            Classroom.Courses.CourseWork.remove(courseId,classWorksDraft[j].id);
          }
        } 
      }
      var classWorks = Classroom.Courses.CourseWork.list(courseId).courseWork;
      if(classWorks){
        for(var j=0;j<classWorks.length;j++){
          //Logger.log(classWorks[j].title);
          //Logger.log(classWorks[j].topicId + " "+topicId );
          if(classWorks[j].topicId === topicId){
            Classroom.Courses.CourseWork.remove(courseId,classWorks[j].id);
          }
        } 
      }
      Classroom.Courses.Topics.remove(courseId, topicId);
      sheet.getRange(i, 3).setValue("Done!");
    }
    
    sheet.getRange(14, 5).setValue("Result:Success").setBackground("green").setFontColor("white");
}
  catch(err){
          sheet.getRange(14, 5).setValue("Result:Error occured"+err).setBackground("red").setFontColor("white");
  }
}

// Clone a section
function cloneSection() {
  try{
    
    var sheet = SpreadsheetApp.getActive().getSheetByName("Clone a section");
    sheet.getRange(14, 5).setValue("Processing").setBackground("blue").setFontColor("white");
    var lastRow=getLastDataRow(sheet);
    for(var i=2;i<=lastRow;i++){
      sheet.getRange(i, 4).setValue("Copying!");
      var fromEnrolmentCode=sheet.getRange(i,1).getValue();
      var topicId=sheet.getRange(i,3).getValue().toString(10);
      var toEnrolmentCode=sheet.getRange(i,2).getValue();
      //Logger.log(topicId)
      //Logger.log(fromEnrolmentCode);
      copyTopicAndAssin(fromEnrolmentCode,topicId,toEnrolmentCode);
      sheet.getRange(i, 4).setValue("Done!");
    }
    sheet.getRange(14, 5).setValue("Result:Success").setBackground("green").setFontColor("white");
  }
  catch(err){
      sheet.getRange(14, 5).setValue("Result:Error occured"+err).setBackground("red").setFontColor("white");
  }
}

function getLastDataRow(sheet) {
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange("A" + lastRow);
  if (range.getValue() !== "") {
    return lastRow;
  } else {
    return range.getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
  }              
}

// Make section PUBLSIHED
function activateSection(){
  try{
    var sheet = SpreadsheetApp.getActive().getSheetByName("Publish a section");
    sheet.getRange(14, 5).setValue("Result:Processing").setBackground("blue").setFontColor("white");
    var lastRow=getLastDataRow(sheet);
    for(var i=2;i<=lastRow;i++){
      sheet.getRange(i, 3).setValue("Publishing..");
      var topicId=sheet.getRange(i,1).getValue().toString();
      var enrolmentCode=sheet.getRange(i,2).getValue();
      var courseId=getClassroomId(enrolmentCode);
      var optionalArgsDraft={
        courseWorkStates:"DRAFT"
      }
      var classWorksDraft = Classroom.Courses.CourseWork.list(courseId, optionalArgsDraft).courseWork;
      if(classWorksDraft){
        for(var j=0;j<classWorksDraft.length;j++){
          //Logger.log(classWorks[j].title);
          //Logger.log(classWorks[j].topicId + " "+topicId );
          if(classWorksDraft[j].topicId === topicId){
            classWorksDraft[j].state="PUBLISHED";
            var optionalArgs={
              updateMask:'state'
            }
            Classroom.Courses.CourseWork.patch(classWorksDraft[j], courseId, classWorksDraft[j].id, optionalArgs);
            sheet.getRange(i, 3).setValue("Done!");
          }
        } 
      }
    }
   
    sheet.getRange(14, 5).setValue("Result:Success").setBackground("green").setFontColor("white");
  }
  catch(err){
    sheet.getRange(14, 5).setValue("Result:Error occured"+err).setBackground("red").setFontColor("white");
  }
}

// Listing assignments
var counter=2;
function listAssn(){
  try{
    var sheet = SpreadsheetApp.getActive().getSheetByName("Publish Individual");
    sheet.getRange(20, 2).setValue("Processing").setBackground("blue").setFontColor("white");
    
    var numRows = sheet.getLastRow() - 2 + 1;
    var range0 = sheet.getRange(2, 5, numRows);
    var range1 = sheet.getRange(2, 6, numRows);
    var range2 = sheet.getRange(2, 7, numRows);
    var range3 = sheet.getRange(2, 8, numRows);
    var range4 = sheet.getRange(2, 9, numRows);
    var range5 = sheet.getRange(2, 10, numRows);
    var range6 = sheet.getRange(2, 11, numRows);
    range0.clear();range1.clear();range2.clear();range3.clear();range4.clear();range5.clear();range6.clear();
    var topicId=sheet.getRange(2,1).getValue().toString();
    var enrolmentCode=sheet.getRange(2,2).getValue();
    var courseId=getClassroomId(enrolmentCode);
    var optionalArgsDraft={
      courseWorkStates:["DRAFT","PUBLISHED"]
    }
    
    var courseWork=Classroom.Courses.CourseWork.list(courseId,optionalArgsDraft).courseWork;
    if(courseWork){
      for(var i=0;i<courseWork.length;i++){
        if(courseWork[i].topicId === topicId){
          sheet.getRange(counter, 5).setValue(courseWork[i].id);
          sheet.getRange(counter, 6).setValue(courseWork[i].title);
          sheet.getRange(counter, 7).setValue(courseWork[i].state);
          if(courseWork[i].dueDate){
            //Logger.log(courseWork[i].dueDate);
            var dueDate=new Date();
            //Logger.log(courseWork[i].dueDate.month);
            dueDate.setMonth(courseWork[i].dueDate.month-1);
            dueDate.setDate(courseWork[i].dueDate.day);
            dueDate.setFullYear(courseWork[i].dueDate.year);
            dueDate.setUTCHours(courseWork[i].dueTime.hours);
            if(courseWork[i].dueTime.minutes)
              dueDate.setUTCMinutes(courseWork[i].dueTime.minutes);
            else
              dueDate.setUTCMinutes(0);
           // Logger.log(courseWork[i]);
            var currentOffset = dueDate.getTimezoneOffset();
            var ISTOffset = 330;
            var ISTdueDate=new Date(dueDate.getTime() + (ISTOffset + currentOffset)*60000);
            sheet.getRange(counter, 8).setValue(((ISTdueDate.getMonth()+1).toString().padStart(2,"0"))+"/"+ISTdueDate.getDate()+"/"+ISTdueDate.getFullYear());
            sheet.getRange(counter, 9).setValue(ISTdueDate.getHours()+":"+ISTdueDate.getMinutes());
          }
          if(courseWork[i].scheduledTime){
            var scheduleDate=new Date(courseWork[i].scheduledTime); 
            var currentOffset = scheduleDate.getTimezoneOffset();
            var ISTOffset = 330;
            var ISTTime = new Date(scheduleDate.getTime() + (ISTOffset + currentOffset)*60000);
            sheet.getRange(counter, 10).setValue(ISTTime.getMonth()+1+"/"+ISTTime.getDate()+"/"+ISTTime.getFullYear());
            var hours=ISTTime.getHours();
            if(ISTTime.getHours()<10){
              hours="0"+ISTTime.getHours().toString();
            }
            var minutes=ISTTime.getMinutes().toString();
            if(ISTTime.getMinutes()<10){
              minutes="0"+ISTTime.getMinutes().toString();
            }
            sheet.getRange(counter, 11).setValue(hours+":"+minutes);
          }
          counter++;
        }
      }
    }
    sheet.getRange(20, 2).setValue("Result:Success").setBackground("green").setFontColor("white");
  }
  catch(err){
    sheet.getRange(20, 2).setValue("Result:Error occured"+err).setBackground("red").setFontColor("white");
  }
}

// Update assignment
function updateAssn(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("Publish Individual");
  try{
    sheet.getRange(20, 2).setValue("Processing").setBackground("blue").setFontColor("white");
    var topicId=sheet.getRange(2,1).getValue().toString();
    var enrolmentCode=sheet.getRange(2,2).getValue();
    var courseId=getClassroomId(enrolmentCode);
    var optionalArgsDraft={
      courseWorkStates:["DRAFT","PUBLISHED"]
    }
    var courseWork=Classroom.Courses.CourseWork.list(courseId,optionalArgsDraft).courseWork;
    if(courseWork){
      for(var i=0;i<courseWork.length;i++){
        if(courseWork[i].topicId === topicId){
          //Logger.log(sheet.getRange(i+2, 7).getValue());
          if(sheet.getRange(i+2, 7).getValue()!=='DRAFT'){
            courseWork[i].state=sheet.getRange(i+2, 7).getValue();
            
            //Logger.log(sheet.getRange(i+2, 8).getValue());
            if(sheet.getRange(i+2, 8).getValue()){
              var date=sheet.getRange(i+2, 8).getValue();
              var year=date.getUTCFullYear();
              var month=date.getUTCMonth()+1;
              var day=date.getUTCDate();
              var newDate={
                year:year,
                month:month,
                day:day
              }
            //  Logger.log(newDate);
              courseWork[i].dueDate=newDate;
            }
            if(sheet.getRange(i+2, 9).getValue()){
              var time=sheet.getRange(i+2, 9).getValue();
              time.setUTCMinutes(time.getUTCMinutes()-8);
              var hours=time.getUTCHours();
              var minutes=time.getUTCMinutes();
              var newTime={
                hours:hours,
                minutes:minutes
              }
              // Logger.log(newTime);
              courseWork[i].dueTime=newTime;
              
            }
            
            var optionalArgs={
              updateMask:'state,dueDate,dueTime'
            }
            Classroom.Courses.CourseWork.patch(courseWork[i], courseId, courseWork[i].id,optionalArgs);
          }
          else if(sheet.getRange(i+2, 7).getValue()==='DRAFT'){
            if(sheet.getRange(i+2, 10).getValue()){
              var date=sheet.getRange(i+2, 10).getValue();
              var year=date.getFullYear();
              var month=date.getMonth();
              var day=date.getDate();
              var time=sheet.getRange(i+2, 11).getValue();
              var hours=time.getUTCHours();
              var minutes=time.getUTCMinutes();
              var newDate=new Date();
              newDate.setFullYear(year);
              newDate.setMonth(month);
              newDate.setDate(day);
              newDate.setUTCHours(hours);
              newDate.setUTCMinutes(minutes-8);
              var ISOstring=newDate.toISOString();
              courseWork[i].scheduledTime=ISOstring;
              //Logger.log(ISOstring);
              
            }
            if(sheet.getRange(i+2, 8).getValue()){
              var date=sheet.getRange(i+2, 8).getValue();
              var year=date.getFullYear();
              var month=date.getMonth()+1;
              var day=date.getDate();
              var newDate={
                year:year,
                month:month,
                day:day
              }
             // Logger.log(newDate);
              courseWork[i].dueDate=newDate;
            }
            if(sheet.getRange(i+2, 9).getValue()){
              var time=sheet.getRange(i+2, 9).getValue();
              time.setUTCMinutes(time.getUTCMinutes()-8);
              var hours=time.getUTCHours();
              var minutes=time.getUTCMinutes();
              var newTime={
                hours:hours,
                minutes:minutes
              }
              // Logger.log(newTime);
              courseWork[i].dueTime=newTime;
              
            }
            var optionalArgs={
                updateMask:'dueDate,dueTime,scheduledTime'
             }
              //Logger.log(courseWork[i]);
              Classroom.Courses.CourseWork.patch(courseWork[i], courseId, courseWork[i].id,optionalArgs);
          }
        }
      }
      listAssn();
    }
//    var sheet = SpreadsheetApp.getActiveSheet();
//    var numRows = sheet.getLastRow() - 2 + 1;
//    var range1 = sheet.getRange(2, 6, numRows);
//    var range2 = sheet.getRange(2, 7, numRows);
//    var range3 = sheet.getRange(2, 8, numRows);
//    var range4 = sheet.getRange(2, 9, numRows);
//    var range5 = sheet.getRange(2, 10, numRows);
//    var range6 = sheet.getRange(2, 11, numRows);
//    range1.clear();range2.clear();range3.clear();range4.clear();range5.clear();range6.clear();
    sheet.getRange(20, 2).setValue("Result:Success").setBackground("green").setFontColor("white");

  }
  catch(err){
    sheet.getRange(20, 2).setValue("Result:Error Occured"+err).setBackground("red").setFontColor("white");
  }
}

// List all courses
function listCourses(){
  try{
    var sheet = SpreadsheetApp.getActive().getSheetByName("Get all courses");
    sheet.getRange(14, 5).setValue("Processing").setBackground("blue").setFontColor("white");
    var numRows = sheet.getLastRow() - 2 + 1;
    if(numRows>0){
      var range1 = sheet.getRange(2, 1, numRows);
      var range2 = sheet.getRange(2, 2, numRows);
      var range3 = sheet.getRange(2, 3, numRows);
      range1.clear();range2.clear();range3.clear();
    }
    var courses=Classroom.Courses.list().courses;
    //Logger.log(courses);
    for(var i=0;i<courses.length;i++){
      sheet.getRange(i+2, 1).setValue(courses[i].name);
      sheet.getRange(i+2,2).setValue(courses[i].enrollmentCode);
      sheet.getRange(i+2,3).setValue(courses[i].courseState);
    }
    sheet.getRange(14, 5).setValue("Result:Success").setBackground("green").setFontColor("white");
  }catch(err){
    sheet.getRange(14, 5).setValue("Result:Error Occured"+err).setBackground("red").setFontColor("white");
  }
  
}
// List all sections
function listSections(){
  try{
    var sheet = SpreadsheetApp.getActive().getSheetByName("Get all topics");
    sheet.getRange(14, 7).setValue("Processing").setBackground("blue").setFontColor("white");
    var numRows = sheet.getLastRow() - 2 + 1;
    // Logger.log(numRows);
    var range1 = sheet.getRange(2, 4, numRows);
    range1.clear();
    var range2 = sheet.getRange(2, 5, numRows);
    range2.clear();
    var enrolmentCode=sheet.getRange(2,1).getValue();
    var courseId=getClassroomId(enrolmentCode);
    var topics=Classroom.Courses.Topics.list(courseId).topic;
    if(topics){
      for(var i=0;i<topics.length;i++){
        sheet.getRange(i+2,4).setValue(topics[i].name);
        sheet.getRange(i+2,5).setValue(topics[i].topicId);
      }
    }
    sheet.getRange(14, 7).setValue("Result:Success").setBackground("green").setFontColor("white");
  }
  catch(err){
    sheet.getRange(14, 7).setValue("Result:Error Occured"+err).setBackground("red").setFontColor("white");
  }   
}
function getTopicId(topicName,courseId){
 
  var topics = Classroom.Courses.Topics.list(courseId).topic;
  for(var m=0;m<topics.length;m++){
    if(topics[m].name===topicName){
      var topicId=topics[m].topicId;
      return topicId;
    }
  }       
}




function copyTopicAndAssin(fromEnrolmentCode,topicId,toEnrolmentCode) {
  var response=Classroom.Courses.list();
  var courses=response.courses;
  if (courses && courses.length > 0) {
    for (i = 0; i < courses.length; i++) {
      var course = courses[i];
      if(course.enrollmentCode === fromEnrolmentCode){
        var topics = Classroom.Courses.Topics.list(course.id).topic;
        for(var j=0;j<topics.length;j++){
          if(topics[j].topicId===topicId){
            var topicId=topics[j].topicId;
            copyTopic(topics[j],fromEnrolmentCode,topics[i].name,toEnrolmentCode);
          }
        }
      }
    }
  }
}

function copyTopic(topic,fromEnrolmentCode,topicName,toEnrolmentCode){
  var response=Classroom.Courses.list();
  var courses=response.courses;
  if (courses && courses.length > 0) {
    for (i = 0; i < courses.length; i++) {
      var course = courses[i];
      if(course.enrollmentCode === toEnrolmentCode){
        var newtopic=Classroom.Courses.Topics.create(topic,course.id);
        copyCourseWork(newtopic.topicId,topic.topicId,fromEnrolmentCode,topicName,toEnrolmentCode); 
      }
    }
  }
}

function getClassroomId(enrolmentCode){
  var response=Classroom.Courses.list();
  var courses=response.courses;
  if (courses && courses.length > 0) {
    for (var l = 0; l < courses.length; l++) {
      var course = courses[l];
      if(course.enrollmentCode == enrolmentCode){
        return course.id;
      }
    }
  }
}

function editMaterial(materials){
  var newMaterial=[];
  if(materials){
    for(var m=0;m<materials.length;m++){
      if(materials[m].form){
        var material={
          'link': { 'url': materials[m].form.formUrl }
        }
        newMaterial.push(material);
      }
      else{
        newMaterial.push(materials[m]);
      }
    }
  }
  return newMaterial;
}

//function correctTitle(){
//  var title='Chapter 5 -Study Material - Tile Maps '
//  for(var i=0;i<title.length;i++){
//    if(title[i]==='-'){
//      var counter=0;
//      for(var j=0;j<title.length;j++){
//        if(title[j]!==' '){
//          break;
//        }
//        else{
//          counter++;
//        }
//      }
//      Logger.log(counter);
//      if(counter===0){
//        
//      }
//      else if(counter===1){
//      
//      }
//      else if(counter>1){
//      
//      }
//    }
//  }
//}
function copyCourseWork(toTopicId,fromTopicId,fromEnrolmentCode,topicName,toEnrolmentCode){
  var response=Classroom.Courses.list();
  var courses=response.courses;
  var assignmentsToCreate=[];
  if (courses && courses.length > 0) {
    for (i = 0; i < courses.length; i++) {
      var course = courses[i];
      if(course.enrollmentCode == fromEnrolmentCode){
        var classWorks = Classroom.Courses.CourseWork.list(course.id).courseWork;
        for(var j=0;j<classWorks.length;j++){
            if(classWorks[j].topicId === fromTopicId){
                  //Logger.log("ran");
                  var newId=getClassroomId(toEnrolmentCode);
                  //Logger.log(classWorks[j]);
                  var materials=editMaterial(classWorks[j].materials);
                  //var correctedTitle=correctTitle(classWorks[j].title);
                 // Logger.log(materials);)
                  var newClasswork={
                     maxPoints:classWorks[j].maxPoints,
                     title:classWorks[j].title,
                     topicId:toTopicId,
                     submissionModificationMode:classWorks[j].submissionModificationMode,
                     state:"DRAFT",
                     workType:classWorks[j].workType,
                     assigneeMode:classWorks[j].assigneeMode,
                     materials:materials,
                     description:classWorks[j].description
                  }
                //Logger.log(newClasswork);
                assignmentsToCreate.push(newClasswork);
                //var newAssn=Classroom.Courses.CourseWork.create(newClasswork, newId);
               // Logger.log(newAssn);
            }
         }
         var optionalArgsDraft={
           courseWorkStates:"DRAFT"
         }
         var classWorksDraft = Classroom.Courses.CourseWork.list(course.id,optionalArgsDraft).courseWork;
          for(var j=0;j<classWorksDraft.length;j++){
            if(classWorksDraft[j].topicId === fromTopicId){
                //  Logger.log("ran");
                  var newId=getClassroomId(toEnrolmentCode);
                  //Logger.log(classWorks[j]);
                  var materials=editMaterial(classWorksDraft[j].materials);
                 // Logger.log(materials);
                  var newClasswork={
                     maxPoints:classWorksDraft[j].maxPoints,
                     title:classWorksDraft[j].title,
                     topicId:toTopicId,
                     submissionModificationMode:classWorksDraft[j].submissionModificationMode,
                     state:"DRAFT",
                     workType:classWorksDraft[j].workType,
                     assigneeMode:classWorksDraft[j].assigneeMode,
                     materials:materials,
                     description:classWorksDraft[j].description
                  }
                //Logger.log(newClasswork);
                assignmentsToCreate.push(newClasswork);
               // var newAssn=Classroom.Courses.CourseWork.create(newClasswork, newId);
                //Logger.log(newAssn);
            }
         }
        }
      }
    if(assignmentsToCreate){
      assignmentsToCreate.sort(function(a,b){  // assignment to create is array having all assignments of a topic
          var s1=a.title.split(" ");
          var s2=b.title.split(" ");
        //Logger.log(s1);
//          if((s1[0][0]==='C' || s1[0][0]==='c') && (s2[0][0]!=='C' || s2[0][0]!=='c')){
//           return -1;
//          }
//          else if((s1[0][0]!=='C' || s1[0][0]!=='c') && (s2[0][0]==='C' || s2[0][0]==='c')){
//           return 1;  
//         //}
        // else if((s1[0][0]==='C' || s1[0][0]==='c') && (s2[0][0]==='C' || s2[0][0]==='c')){
            var chapterNumber1=parseInt(s1[1],10);   //sort on basis of chapter number
            var chapterNumber2=parseInt(s2[1],10);
            if(chapterNumber1<chapterNumber2){
              return -1;
            } 
            else if(chapterNumber1===chapterNumber2){  // if chapter number is same sort in order Study Material -> Mini Assign -> Assign -> Challange
              var assignmentType1=(a.title.split("-")[1])[1];
              var assignmentType2=(b.title.split("-")[1])[1];
              //Logger.log()
              if(assignmentType1[0]==='A' && assignmentType2[0]==='C'){  
                return -1;
              }
              else if(assignmentType2[0]==='A' && assignmentType2[0]==='C'){
                return 1;
              }
              else if(assignmentType1<assignmentType2){
                return 1;
              }else{
              return -1;
              }
            }
            else{
              return 1;
            }
      //  }
//        else{
//          return 1;
//        }
          
      });
      var newId=getClassroomId(toEnrolmentCode);
      for(var i=assignmentsToCreate.length-1;i>=0;i--){
        var newAssn=Classroom.Courses.CourseWork.create(assignmentsToCreate[i], newId);
        Logger.log(newAssn);
      }
    }
     }
}




 
