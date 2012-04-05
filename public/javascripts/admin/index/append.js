
    var create_type = 0;
    var interval = null;
    var table_id = window.location.pathname.split('/');
    table_id = table_id[table_id.length-1];
    
    head(function(){
      $('#hugeUploader').hide();
  	  //Drop files on the dashboard to import them
      $(document).bind('dragenter', onDragEnter);
      
      $('form#import_file').submit(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (!$('div.create_window span.bottom input').hasClass('disabled')) {
          if (create_type==0) {
            var geom_type = $('div.geom_type span.selected a').text().toLowerCase();
            
            if (geom_type=="point") {
              geom_type="point";              
            } else if (geom_type=="polygon") {
              geom_type="multipolygon";
            } else {
              geom_type="multilinestring";
            }
            
            createNewToFinish(geom_type,'');
          } else if (create_type==2) {
						var url = $('div.select_file input#url_txt').val();
						if (isURL(url)) {
							$('div.error_url').stop().fadeOut();
							createNewToFinish('',url,true);
						} else {
							$('div.error_url').stop().fadeIn().delay(2000).fadeOut();;
						}
          }
        }
      });
      
      
      $('span.file input').hover(function(ev){
        $('span.file a').addClass('hover');
        $(document).css('cursor','pointer');
      },function(ev){
        $('span.file a').removeClass('hover');
        $(document).css('cursor','default');
      });

      //Uploader for the modal window
      var uploader = new qq.FileUploader({
        element: document.getElementById('uploader'),
        action: '/upload',
        params: {"append":1, "table_id": table_id},
        allowedExtensions: ['csv', 'xls', 'xlsx', 'zip', 'kml', 'geojson', 'json', 'ods', 'kmz', 'gpx', 'tar', 'gz', 'tgz'],
        sizeLimit: 0, // max size
        minSizeLimit: 0, // min size
        debug: false,
        onSubmit: function(id, fileName){
          $('span.file').addClass('uploading');     
        },
        onProgress: function(id, fileName, loaded, total){
          var percentage = loaded / total;
          $('span.progress').width((346*percentage)/1);
        },
        onComplete: function(id, fileName, responseJSON){
          createNewToFinish('',responseJSON.file_uri);
        },
        onCancel: function(id, fileName){},
        showMessage: function(message){
        }
      });
      
      
      //Uploader for the whole page (dashboard only)
      var hugeUploader = new qq.FileUploader({
      	element: document.getElementById('hugeUploader'),
      	action: '/upload',
      	params: {"append":1, "table_id": table_id},
        allowedExtensions: ['csv', 'xls', 'xlsx', 'zip', 'kml', 'geojson', 'json', 'ods', 'kmz', 'gpx', 'tar', 'gz', 'tgz'],
      	sizeLimit: 0,
      	minSizeLimit: 0,
      	debug: false,

      	onSubmit: function(id, fileName){
        	resetUploadFile();
          $('#hugeUploader').hide();
          bindESC();		  
      	},
      	onProgress: function(id, fileName, loaded, total){
      		var percentage = loaded / total;
      		$('span.progress').width((346*percentage)/1);
      	},
      	onComplete: function(id, fileName, responseJSON){
      		createNewToFinish('',responseJSON.file_uri);
      		$('#hugeUploader').hide();
      	},
      	onCancel: function(id, fileName){},
      	showMessage: function(message){
          bindESC();
      	}
      });
    });
    

    function resetUploadFile() {
      create_type = 0;
      $('div.qq-upload-drop-area').hide();
    }


    function createNewToFinish (type,url,out) {
        $('div.create_window div.inner_').animate({borderColor:'#FFC209', height:'68px'},500);
        $('div.create_window div.inner_ form').animate({opacity:0},300,function(){
        $('div.create_window div.inner_ span.loading').animate({opacity:1},200, function(){
          var params = {}
          if (url!='') {
            if (!out) {
              params = {file:'http://'+window.location.host + url};
            } else {
              params = {file:url};
            }
          } else {
            params = {the_geom_type:type}
          }
          params['append'] = 1;
          params["table_id"] = table_id;
          
          $.ajax({
            type: "POST",
            url: global_api_url+'tables/',
            data: params,
            headers: {'cartodbclient':true},
            success: function(data, textStatus, XMLHttpRequest) {
              window.location.href = "/tables/"+data.id;
            },
            error: function(e) {
							var json = $.parseJSON(e.responseText);

							if (json.code || json.import_errors) {

								// Reset
								$('div.create_window div.inner_ span.loading').html('');

								// Title
								$('div.create_window div.inner_ span.loading').html('<h5>Oops! There has been an error</h5>');

								// Description
								if (json.description) {
									$('div.create_window div.inner_ span.loading').append('<p>' + json.description + '</p>');
								}

								// Stack
								if (json.stack && json.stack.length>0) {
									$('div.create_window div.inner_ span.loading').append('<p class="see_details"><a class="see_more" href="#show_more">see details</a></p>');
									
									var stack = '<span style="display:none; padding:10px 0 0;"><h6>Code ' + (json.code || '') + '</h6><dl>';
									for (var i=0,_length=json.stack.length; i<_length; i++) {
										stack += '<dd>' + json.stack[i] + '</dd>';
									}
									stack += '</dl></span>';
									$('div.create_window div.inner_ span.loading').append(stack);
								}

								// Are there still hints?
                //$('div.create_window div.inner_ span.loading p').appen(json.raw_error +'<br/><br/>'+ json.hint);
                
							} else {
                $('div.create_window div.inner_ span.loading p').html('There has been an error, please <a href="mailto:support@cartodb.com">contact us</a> with a sample of your data if possible. Thanks!');
                $('div.create_window div.inner_ span.loading h5').text('Oops! Error');
							}
						  $('div.create_window div.inner_ span.loading').addClass('error');
							$('div.create_window a.close_create').show().addClass('last');
              $('div.create_window div.inner_').height($('div.create_window div.inner_ span.loading').height() + 30);
            }
          });
        });
      });
      setTimeout(function(){$('div.create_window a.close_create').addClass('last');},250);
    }
    
    function onDragEnter(event){
  		event.stopPropagation();
  		event.preventDefault();
  		$('#hugeUploader').show();
  		$('.qq-upload-drop-area').show();  		
  		$('#hugeUploader .qq-upload-drop-area').bind('dragleave', onDragExit);
  		$('#hugeUploader .qq-upload-drop-area').bind('drop', onDragExit);  		
  		$('#hugeUploader .qq-upload-drop-area').bind('dragover', function(event) {event.stopPropagation(); event.preventDefault();});
  		return false;
    };
    
    function onDragExit(event){
  		event.stopPropagation();
  		event.preventDefault();
  		$('#hugeUploader').hide();
  		$('.qq-upload-drop-area').hide();
  		return false;
    };
    


    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.create_window').hide();
            $('div.mamufas div.export_window').hide();
            $('span.privacy_window').fadeOut('fast');
          });
        }
      });
    };

    function unbindESC() {
      $(document).unbind('keydown');
    };


