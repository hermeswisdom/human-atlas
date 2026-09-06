import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyViewerLink,parseExplode,parseViewerSearch,resolveSelection,selectionToken,serializeViewerSearch,viewerHref} from '../app/url-state.ts';
import {DEFAULT_VISIBLE,ORGAN_SYSTEMS} from '../app/anatomy.ts';

assert.deepEqual(parseViewerSearch(''),{});
assert.deepEqual(parseViewerSearch('?system=skeletal'),{visible:['skeletal']});
assert.deepEqual(parseViewerSearch('?system=skeleton'),{visible:['skeletal']});
assert.deepEqual(parseViewerSearch('?system=organs'),{visible:ORGAN_SYSTEMS});
assert.deepEqual(parseViewerSearch('?systems=cardiac,bogus,digestive'),{visible:['cardiac','digestive']});
assert.deepEqual(parseViewerSearch('?system=not-a-system'),{});
assert.deepEqual(parseViewerSearch('?system=none'),{visible:[]});
assert.deepEqual(parseViewerSearch('?explode=1&select=heart'),{explode:1,select:'heart'});
assert.deepEqual(parseViewerSearch('?concept=FMA7088&explode=assembled'),{explode:0,select:'FMA7088'});
assert.equal(parseExplode('50'),.5);
assert.equal(parseExplode('exploded'),1);
assert.equal(parseExplode('xyz'),undefined);

assert.equal(serializeViewerSearch({visible:DEFAULT_VISIBLE,explode:0}),'');
assert.equal(serializeViewerSearch({visible:['skeletal'],explode:0}),'?system=skeletal');
assert.equal(serializeViewerSearch({visible:ORGAN_SYSTEMS,explode:1,select:'FMA7088'}),'?system=organs&explode=1&select=FMA7088');
assert.equal(serializeViewerSearch({visible:[],explode:0}),'?system=none');
assert.equal(serializeViewerSearch({visible:DEFAULT_VISIBLE,explode:.33}),'?explode=0.33');
assert.equal(viewerHref('/','#x','?system=skeletal'),'/?system=skeletal#x');

const atlas=JSON.parse(await readFile(new URL('../public/models/atlas.json',import.meta.url)));
assert.equal(resolveSelection(atlas,'FMA7088')?.concept.name,'heart');
assert.equal(resolveSelection(atlas,'heart')?.concept.id,'FMA7088');
assert.equal(resolveSelection(atlas,'FJ3365')?.selected[0],'FJ3365');
assert.equal(resolveSelection(atlas,'right femur')?.concept.id,'FMA24474');
assert.equal(resolveSelection(atlas,'not-a-real-structure'),null);
assert.equal(resolveSelection(atlas,'left'),null);

const heart=applyViewerLink(atlas,parseViewerSearch('?concept=heart&system=organs&explode=1'));
assert.equal(heart.chosen?.id,'FMA7088');
assert.deepEqual(heart.state.visible,ORGAN_SYSTEMS);
assert.equal(heart.state.explode,1);
assert.equal(heart.state.view,'front');

const invalid=applyViewerLink(atlas,parseViewerSearch('?select=nope&system=banana'));
assert.equal(invalid.chosen,null);
assert.equal(invalid.state.selected,undefined);
assert.equal(invalid.state.visible,undefined);

assert.equal(selectionToken(atlas,heart.chosen.elements,heart.chosen),'FMA7088');
assert.equal(selectionToken(atlas,['FJ3365'],{id:'FMA24474',name:'right femur',elements:['FJ3365']}),'FMA24474');

console.log('URL parse, serialize, and soft-fail selection checks passed.');
