
var xmlWriter = require('xml-writer'),
    _ = require('underscore'),
    Q = require('q'),
    request = require('request'),
    parseString = require('xml2js').parseString;

var blankDoc = {
    FirmName: '',
    Address1: '', // apartment or suite number
    Address2: '', // street address
    City: '',
    State: '',
    Zip5: '',
    Zip4: ''
};

var liveAPIUrl = 'http://production.shippingapis.com/ShippingAPI.dll';

module.exports = function(userid) {
    var self=this;

    function makeXMLRequest(address) {
        _.defaults(address, blankDoc);
        var xml = new xmlWriter();
        xml.startDocument();
        xml.startElement('AddressValidateRequest').writeAttribute('USERID', userid);
        xml.startElement('Address').writeAttribute('ID', '0');

        var fields = ['FirmName', 'Address1', 'Address2', 'City', 'State', 'Zip5', 'Zip4'];

        fields.forEach(function(f) {
            xml.startElement(f).text(address[f]).endElement();
        });

        xml.endElement();
        xml.endElement();
        xml.endDocument();
        return xml.toString();
    }

    self.validate = function(address, callback) {

        var dfd = Q(null).then(function() {
            var xml = makeXMLRequest(address);

            var queryString = {
                'API': 'Verify',
                'XML': xml
            };

            return Q.nfcall(request, {
                method: 'GET', url: liveAPIUrl, qs: queryString
            }).then(function(resp) {
                return Q.nfcall(parseString, resp[1]).then(function(pojo) {
                    var obj = pojo.AddressValidateResponse.Address[0];
                    if (obj.Error) {
                        throw new Error(obj.Error[0].Description);
                    } else {
                        delete obj.$;
                        _.each(obj, function(v, k) {
                            obj[k] = v[0];
                        });
                        return obj;
                    }
                });
            });
        });

        if (callback) {
            dfd.then(function(res) {
                callback(null, res);
            }).catch(callback);
        }

        return dfd;

    };
};

module.exports.testDoc = {
    FirmName: '',
    Address1: '', // apartment or suite number
    Address2: '75 Main St', // street address
    City: 'American Fork',
    State: 'UT',
    Zip5: '84003',
    Zip4: ''
};
