Template.registerHelper( 'dateTime', ( timestamp ) => {
    if ( timestamp ) {
      let momentToFormat = moment( timestamp ).format("DD.MM.YYYY HH:mm");
      return momentToFormat
    }
    return "";
  });